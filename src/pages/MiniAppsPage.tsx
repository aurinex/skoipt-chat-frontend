import { useEffect, useState } from "react";
import api from "../services/api";
import { useParams } from "react-router-dom";

function MiniAppsPage() {
  const { appId } = useParams();
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appId) return;

    const loadApp = async () => {
      try {
        const { url, token } = await api.miniApps.launch(appId);

        const fullUrl = new URL(url);
        fullUrl.searchParams.set("token", token);

        setIframeUrl(fullUrl.toString());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadApp();
  }, [appId]);

  if (loading) return <div>Загрузка mini app...</div>;
  if (!iframeUrl) return <div>Ошибка загрузки</div>;

  return (
    <iframe
      src={iframeUrl}
      style={{ width: "100%", height: "100vh", border: "none" }}
      sandbox="allow-scripts allow-same-origin"
    />
  );
}

export default MiniAppsPage;
