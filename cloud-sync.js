(function () {
  const config = window.SIERRA_AZUL_CONFIG || {};
  const storageKey = "sierraAzulPortal";
  const hasSupabase = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase);

  if (!hasSupabase) {
    window.SierraAzulCloud = {
      enabled: false,
      signIn: async (password) => password === (config.adminPassword || "sierrazul"),
    };
    return;
  }

  const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  const portalId = config.portalId || "sierra-azul";
  let remoteLoaded = false;
  let saving = false;

  window.SierraAzulCloud = {
    enabled: true,
    signIn: async (password) => password === config.adminPassword,
    saveNow,
  };

  hydrateFromCloud();

  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function (key, value) {
    originalSetItem(key, value);
    if (key === storageKey && remoteLoaded && !saving) {
      saveNow(value);
    }
  };

  async function hydrateFromCloud() {
    const { data, error } = await client
      .from("portal_state")
      .select("data")
      .eq("id", portalId)
      .maybeSingle();

    remoteLoaded = true;

    if (error || !data?.data) return;

    const remote = JSON.stringify(data.data);
    if (remote && remote !== localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, remote);
      if (!sessionStorage.getItem("sierraAzulCloudReloaded")) {
        sessionStorage.setItem("sierraAzulCloudReloaded", "1");
        window.location.reload();
      }
    }
  }

  async function saveNow(rawValue) {
    const value = rawValue || localStorage.getItem(storageKey);
    if (!value) return;

    saving = true;
    try {
      await client
        .from("portal_state")
        .upsert({
          id: portalId,
          data: JSON.parse(value),
          updated_at: new Date().toISOString(),
        });
    } finally {
      saving = false;
    }
  }
})();
