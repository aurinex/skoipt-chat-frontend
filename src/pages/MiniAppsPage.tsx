import { useEffect, useState } from "react";
import api from "../services/api";

function MiniAppsPage() {
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApp = async () => {
      try {
        const { url, token } = await api.miniApps.launch("schedule");

        setIframeUrl(`${url}?token=${token}`);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadApp();
  }, []);

  if (loading) return <div>Загрузка mini app...</div>;

  if (!iframeUrl) return <div>Ошибка загрузки</div>;

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <iframe
        src={iframeUrl}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}

export default MiniAppsPage;
