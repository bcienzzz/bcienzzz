import App from "@/components/App";
import { DEFAULT_ZONE_ID } from "@/config/zones";
import { getDatiZona } from "@/lib/dati";

export default async function Home() {
  const dati = await getDatiZona(DEFAULT_ZONE_ID);
  return <App dati={dati} />;
}
