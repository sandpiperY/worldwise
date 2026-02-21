import fs from "fs";
import path from "path";

export default async ({ strapi }) => {
  const filePath = path.join(process.cwd(), "data/cities.json");

  if (!fs.existsSync(filePath)) {
    console.log("❌ cities.json not found");
    return;
  }

  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const cities = raw.cities;

  const existing = await strapi.entityService.findMany("api::city.city");
  if (existing.length > 0) {
    console.log("⚠ Cities already exist. Skipping import.");
    return;
  }

  for (const city of cities) {
    await strapi.entityService.create("api::city.city", {
      data: {
        cityName: city.cityName,
        country: city.country,
        emoji: city.emoji,
        date: city.date,
        notes: city.notes,
        position: {
          lat: Number(city.position.lat),
          lng: Number(city.position.lng),
        },
      },
    });
  }

  console.log("✅ Cities imported successfully");
};
