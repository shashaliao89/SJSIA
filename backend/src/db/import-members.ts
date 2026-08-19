import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./pool.js";

interface ImportedKol {
  source_ref: string;
  name: string;
  ig_url: string | null;
  follower_count: number;
  follower_count_raw: string | null;
  collaboration_price: string | null;
  boarding_status: string | null;
  is_public: boolean;
  open_to_contact: boolean;
}

const dirname = path.dirname(fileURLToPath(import.meta.url));

async function importMembers() {
  const file = path.resolve(dirname, "../data/member-kols.json");
  const records = JSON.parse(fs.readFileSync(file, "utf8")) as ImportedKol[];
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const kol of records) {
      await client.query(
        `INSERT INTO kol_profiles (
          name, ig_url, follower_count, follower_count_raw, collaboration_price,
          boarding_status, source_ref, open_to_contact, is_public
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (source_ref) WHERE source_ref IS NOT NULL DO UPDATE SET
          name = EXCLUDED.name,
          ig_url = EXCLUDED.ig_url,
          follower_count = EXCLUDED.follower_count,
          follower_count_raw = EXCLUDED.follower_count_raw,
          collaboration_price = EXCLUDED.collaboration_price,
          boarding_status = EXCLUDED.boarding_status,
          open_to_contact = EXCLUDED.open_to_contact,
          is_public = EXCLUDED.is_public,
          updated_at = NOW()`,
        [
          kol.name,
          kol.ig_url,
          kol.follower_count,
          kol.follower_count_raw,
          kol.collaboration_price,
          kol.boarding_status,
          kol.source_ref,
          kol.open_to_contact,
          kol.is_public,
        ]
      );
    }

    await client.query("COMMIT");
    console.log(`Imported ${records.length} KOL member profiles.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

importMembers().catch((error) => {
  console.error(error);
  process.exit(1);
});
