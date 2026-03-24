import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PageNav from '../components/PageNav';
import styles from './AIAssistant.module.css';
import { AI_CHAT_CONFIG } from '../config/aichat';


function getAssistantText(payload) {
  if (typeof payload === 'string') return payload;
  if (!payload || typeof payload !== 'object') return '';

  const candidates = [
    payload.content,
    payload.text,
    payload.delta,
    payload?.data?.content,
    payload?.choices?.[0]?.delta?.content,
    payload?.choices?.[0]?.message?.content
  ];

  for (const item of candidates) {
    if (typeof item === 'string' && item.length > 0) return item;
  }

  return '';
}

function parseEventBlock(eventBlock) {
  const normalizedLines = eventBlock.split('\n').map((line) => line.replace(/\r$/, ''));
  const event = { type: 'message', data: '' };
  const dataLines = [];

  for (const line of normalizedLines) {
    if (!line || line.startsWith(':')) continue;
    if (line.startsWith('event:')) {
      event.type = line.slice(6).trim() || 'message';
      continue;
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  event.data = dataLines.join('\n');
  return event;
}

function AIAssistant() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]); // 所有的对话消息
  const [isStreaming, setIsStreaming] = useState(false); // 是否正在生成回答
  const [error, setError] = useState('');
  const [autoFollow, setAutoFollow] = useState(true);

  const scrollRef = useRef(null);
  const controllerRef = useRef(null);
  const textQueueRef = useRef(''); // 缓存输出文本
  const typingFrameRef = useRef(null); // 打字机动画
  const activeAssistantIdRef = useRef(''); // 当前AI消息ID
  const decoderRef = useRef(new TextDecoder('utf-8')); // 文本解码器
  const sseBufferRef = useRef(''); // 缓存SSE数据
  const streamEndedRef = useRef(false); // 是否收到 [DONE]
  const stopReasonRef = useRef('none'); // none | user | done | cleanup

  const appendAssistantText = (text) => {
    const activeId = activeAssistantIdRef.current;
    if (!activeId || !text) return;
    setMessages((prev) =>
      prev.map((msg) => (msg.id === activeId ? { ...msg, content: msg.content + text } : msg))
    );
  };

  const runTypingLoop = () => {
    if (typingFrameRef.current) return;
    // 如果打字机动画已经在运行，则直接返回

    const tick = () => {
      const queue = textQueueRef.current;
      if (!queue.length) {
        typingFrameRef.current = null;
        return;
      }

      // 每帧输出3个字符
      const chunk = queue.slice(0, 3);
      textQueueRef.current = queue.slice(3);
      appendAssistantText(chunk);
      typingFrameRef.current = requestAnimationFrame(tick);
    };

    typingFrameRef.current = requestAnimationFrame(tick);
  };

  const queueAssistantText = (text) => { // 将文本加入队列，并启动打字机动画
    if (!text) return;
    textQueueRef.current += text;
    runTypingLoop();
  };

  const stopStreaming = (reason = 'user') => {
    stopReasonRef.current = reason;
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const parseSSEChunk = (chunkText) => {
    // sseBufferRef: 划分sse事件（{data: xxx}）
    const normalizedChunk = chunkText.replace(/\r\n/g, '\n');
    sseBufferRef.current += normalizedChunk; // 写入sse缓存
    const events = sseBufferRef.current.split('\n\n');
    // sse 格式 data: xxx /n/n data: xxx
    sseBufferRef.current = events.pop() || '';

    for (const eventBlock of events) {
      const event = parseEventBlock(eventBlock);
      const raw = event.data.trim();
      if (!raw) continue;
      if (raw === '[DONE]') {
        streamEndedRef.current = true;
        stopStreaming('done');
        return;
      }
      if (event.type === 'error') {
        setError(raw);
        continue;
      }

      try {
        // 解析 sse 事件，获取模型回答的文本
        const parsed = JSON.parse(raw);
        const text = getAssistantText(parsed);
        queueAssistantText(text);
      } catch {
        queueAssistantText(raw); // 解析失败，直接将raw写入队列
      }
    }
  };

  const flushSSEBuffer = () => {
    if (!sseBufferRef.current.trim()) return;
    const event = parseEventBlock(sseBufferRef.current);
    const raw = event.data.trim();
    if (raw && raw !== '[DONE]') {
      try {
        const parsed = JSON.parse(raw);
        queueAssistantText(getAssistantText(parsed));
      } catch {
        queueAssistantText(raw);
      }
    }
    sseBufferRef.current = '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const prompt = question.trim();
    if (!prompt || isStreaming) return;

    setError('');
    setQuestion('');
    textQueueRef.current = '';
    sseBufferRef.current = '';
    decoderRef.current = new TextDecoder('utf-8');
    streamEndedRef.current = false;
    stopReasonRef.current = 'none';

    // 构造对话历史
    const payloadMessages = [
      ...messages
        .filter((item) => (item.role === 'user' || item.role === 'assistant') && item.content?.trim())
        .map((item) => ({ role: item.role, content: item.content })),
      { role: 'user', content: prompt }
    ];

    const userMsg = { id: crypto.randomUUID(), role: 'user', content: prompt };
    const assistantId = crypto.randomUUID();
    const assistantMsg = { id: assistantId, role: 'assistant', content: '' };
    activeAssistantIdRef.current = assistantId;
    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    const controller = new AbortController();
    controllerRef.current = controller;
    setIsStreaming(true);

    try {
      const res = await fetch(AI_CHAT_CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream' // 需要sse流
        },
        body: JSON.stringify({
          temperature: 0.7,
          messages: payloadMessages
        }),
        signal: controller.signal // 接收中断信号
      });

      if (!res.ok) {
        let serverMessage = '';
        try {
          const errData = await res.json();
          serverMessage = errData?.error?.message || '';
        } catch {
          serverMessage = '';
        }
        throw new Error(serverMessage || `请求失败: ${res.status}`);
      }
      if (!res.body) {
        throw new Error('浏览器不支持流式响应');
      }

      const reader = res.body.getReader();

      let isDone = false; // 流是否已经读取完毕
      while (!isDone) {
        const { done, value } = await reader.read();
        isDone = done;
        if (done) break;
        if (!value) continue;

        const text = decoderRef.current.decode(value, { stream: true }); // 告诉 decoder：后面还会继续有数据,不要强制结束解码
        parseSSEChunk(text);
      }

      const rest = decoderRef.current.decode(); // 流读取完毕后，将 Decoder 缓冲区中剩余的未完成字符解码
      if (rest) parseSSEChunk(rest);
      flushSSEBuffer();

      // 某些网关/代理会提前断开流连接，未返回 [DONE]，此时视为中断。
      if (!streamEndedRef.current && stopReasonRef.current === 'none') {
        setError('流式输出已中断，已保留已生成内容。');
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setError(err?.message || '会话异常，请稍后再试');
      } else if (!streamEndedRef.current && stopReasonRef.current === 'none') {
        // 非手动中止但触发 AbortError，通常表示连接意外被中断。
        const rest = decoderRef.current.decode();
        if (rest) parseSSEChunk(rest);
        flushSSEBuffer();
        setError('连接中断，已保留已生成内容。');
      }
    } finally {
      controllerRef.current = null;
      setIsStreaming(false);
    }
  };

  const handleMessageScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 60;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setAutoFollow(nearBottom);
  };

  useEffect(() => {
    if (!autoFollow) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, autoFollow]);

  // 页面卸载或组件切换时，停止流式输出，并清理打字机动画
  useEffect(() => {
    return () => {
      stopStreaming('cleanup');
      if (typingFrameRef.current) {
        cancelAnimationFrame(typingFrameRef.current);
      }
      textQueueRef.current = '';
      sseBufferRef.current = '';
      streamEndedRef.current = false;
      stopReasonRef.current = 'none';
    };
  }, []);

  return (
    <main className={styles.page}>
      <PageNav />

      <section className={styles.panel}>
        <header className={styles.header}>
          <h1>AI 助手</h1>
        </header>

        <div className={styles.messagesWrap}>
          <div className={styles.messages} ref={scrollRef} onScroll={handleMessageScroll}>
            {messages.length === 0 ? (
              <p className={styles.empty}>豆包助手已就绪，请输入问题</p>
            ) : (
              messages.map((msg) => (
                <article key={msg.id} className={`${styles.message} ${styles[msg.role]}`}>
                  <strong>{msg.role === 'user' ? '你' : '豆包助手'}</strong>
                  {msg.role === 'assistant' ? (
                    msg.content ? (
                      <div className={styles.markdown}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: ({ ...props }) => (
                              <a {...props} target='_blank' rel='noopener noreferrer' />
                            )
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p>思考中...</p>
                    )
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </article>
              ))
            )}
          </div>
          {!autoFollow && messages.length > 0 ? (
            <button
              className={styles.followBtn}
              type='button'
              onClick={() => {
                const el = scrollRef.current;
                if (!el) return;
                el.scrollTop = el.scrollHeight;
                setAutoFollow(true);
              }}
            >
              回到底部
            </button>
          ) : null}
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder='你可以这样问我：帮我规划一份 5 天上海旅行攻略'
            rows={4}
          />
          <div className={styles.actions}>
            <button type='submit' disabled={isStreaming || !question.trim()}>
              {isStreaming ? '生成中...' : '发送'}
            </button>
            {isStreaming ? (
              <button type='button' onClick={() => stopStreaming('user')} className={styles.stop}>
                停止
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </main>
  );
}

export default AIAssistant;

