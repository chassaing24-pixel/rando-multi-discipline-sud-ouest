
const cfg = window.SUPABASE_CONFIG || {};
const client = (window.supabase && cfg.url && cfg.anonKey)
  ? window.supabase.createClient(cfg.url, cfg.anonKey)
  : null;

async function emailAuth(mode) {
  const msg = document.getElementById("authmsg");
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  msg.textContent = "Connexion en cours...";

  try {
    if (!client) {
      msg.textContent = "Configuration Supabase manquante.";
      return;
    }

    if (!email || password.length < 8) {
      msg.textContent = "E-mail et mot de passe de 8 caractères minimum requis.";
      return;
    }

    const result = mode === "signup"
      ? await client.auth.signUp({ email, password })
      : await client.auth.signInWithPassword({ email, password });

    msg.textContent = result.error
      ? result.error.message
      : mode === "signup"
        ? "Compte créé. Vérifiez votre e-mail."
        : "Connexion réussie.";
  } catch (error) {
    msg.textContent = "Erreur : " + error.message;
  }
}

async function socialAuth(provider) {
  const msg = document.getElementById("authmsg");

  try {
    if (!client) {
      msg.textContent = "Configuration Supabase manquante.";
      return;
    }

    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: { redirectTo: location.href }
    });

    if (error) msg.textContent = error.message;
  } catch (error) {
    msg.textContent = "Erreur : " + error.message;
  
  }
}


async function loadSorties() {
  const zone = document.querySelector("#sorties .notice");
  if (!zone) return;

  zone.textContent = "Chargement des randonnées...";

  if (!client) {
    zone.textContent = "Connexion à la base de données impossible.";
    return;
  }

  const { data, error } = await client
    .from("Sorties")
    .select("*")
    .order("Date_sortie", { ascending: true });

  if (error) {
    zone.textContent = "Erreur : " + error.message;
    return;
  }

  zone.replaceChildren();

  if (!data || data.length === 0) {
    zone.textContent = "Aucune randonnée publiée pour le moment.";
    return;
  }

  data.forEach(sortie => {
    const fiche = document.createElement("article");
    fiche.className = "sortie-card";

    const titre = document.createElement("h3");
    titre.textContent = sortie.Titre || "Randonnée";

    const details = document.createElement("p");
    details.textContent =
      (sortie.Discipline || "") + " · " +
      (sortie.Date_sortie || "") + " · " +
      (sortie.Lieu || "");

    const description = document.createElement("p");
    description.textContent = sortie.Description || "";

    fiche.append(titre, details, description);
    zone.appendChild(fiche);
  });
}


async function loadSorties() {
  const zone = document.querySelector("#sorties .notice");
  if (!zone) return;

  zone.textContent = "Chargement des randonnées...";

  if (!client) {
    zone.textContent = "Connexion à la base de données impossible.";
    return;
  }

  const { data, error } = await client
    .from("Sorties")
    .select("*")
    .order("Date_sortie", { ascending: true });

  if (error) {
    zone.textContent = "Erreur : " + error.message;
    return;
  }

  zone.replaceChildren();

  if (!data || data.length === 0) {
    zone.textContent = "Aucune randonnée publiée pour le moment.";
    return;
  }

  data.forEach(sortie => {
    const fiche = document.createElement("article");
    fiche.className = "sortie-card";

    const titre = document.createElement("h3");
    titre.textContent = sortie.Titre || "Randonnée";

    const details = document.createElement("p");
    details.textContent =
      (sortie.Discipline || "") + " · " +
      (sortie.Date_sortie || "") + " · " +
      (sortie.Lieu || "");

    const description = document.createElement("p");
    description.textContent = sortie.Description || "";

    fiche.append(titre, details, description);
    zone.appendChild(fiche);
  });
}

loadSorties();


