
const cfg = window.SUPABASE_CONFIG || {};
const client = (window.supabase && cfg.url && cfg.anonKey)
  ? window.supabase.createClient(cfg.url, cfg.anonKey)
  : null;

// Identifiant du compte administrateur
const ADMIN_ID = "4a71660b-f732-4bb2-9653-9fc7a059c348";

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

    if (result.error) {
      msg.textContent = result.error.message;
    } else if (mode === "signup") {
      msg.textContent = "Compte créé. Vérifiez votre e-mail.";
    } else {
      msg.textContent = "Connexion réussie.";
      await actualiserEspace();
    }
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

// Affichage des randonnées publiées

async function loadSorties() {
  const zone = document.querySelector("#sorties .notice");
  if (!zone || !client) return;

  zone.textContent = "Chargement des randonnées...";

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

    const infos = document.createElement("p");
    infos.textContent = [
      sortie.Heure ? "Départ : " + sortie.Heure : "",
      sortie.Département ? "Département : " + sortie.Département : "",
      sortie.Prix ? "Prix : " + sortie.Prix : "",
      sortie.Contact ? "Contact : " + sortie.Contact : ""
    ].filter(Boolean).join(" · ");

    
boutonDetails.onclick = () => {
  const modal = document.getElementById("fenetre-details");
  const contenu = document.getElementById("contenu-details");

  contenu.innerHTML = `
    <h2>${sortie.Titre || "Randonnée"}</h2>
    <p><strong>Discipline :</strong> ${sortie.Discipline || ""}</p>
    <p><strong>Date :</strong> ${sortie.Date_sortie || ""}</p>
    <p><strong>Lieu :</strong> ${sortie.Lieu || ""}</p>
    <p><strong>Description :</strong><br>${sortie.Description || ""}</p>
    <p><strong>Départ :</strong> ${sortie.Heure || "Non précisé"}</p>
    <p><strong>Département :</strong> ${sortie.Département || ""}</p>
    <p><strong>Prix :</strong> ${sortie.Prix || "Non précisé"}</p>
    <p><strong>Contact :</strong> ${sortie.Contact || "Non précisé"}</p>
  `;

  modal.style.display = "block";
};

    document.getElementById("fermer-details").onclick = () => {
  document.getElementById("fenetre-details").style.display = "none";
};

fiche.append(titre, details, boutonDetails);
zone.appendChild(fiche);

  });
}


// Affichage des propositions dans l'espace administrateur
async function loadPropositions() {
  const espace = document.getElementById("administration");
  const zone = document.getElementById("sorties-en-attente");

  if (!espace || !zone || !client) return;

  const { data: userData } = await client.auth.getUser();
  const user = userData.user;

  if (!user || user.id !== ADMIN_ID) {
    espace.style.display = "none";
    return;
  }

  espace.style.display = "block";
  zone.textContent = "Chargement des propositions...";

  const { data, error } = await client
    .from("Sorties")
    .select("*")
    .eq("Statut", "en_attente")
    .order("Date_sortie", { ascending: true });

  if (error) {
    zone.textContent = "Erreur : " + error.message;
    return;
  }

  zone.replaceChildren();

  if (!data || data.length === 0) {
    zone.textContent = "Aucune proposition en attente.";
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

    const valider = document.createElement("button");
    valider.textContent = "Valider";
    valider.className = "btn orange";
    valider.onclick = () => changerStatut(sortie.id, "publie");

    const refuser = document.createElement("button");
    refuser.textContent = "Refuser";
    refuser.className = "btn";
    refuser.onclick = () => changerStatut(sortie.id, "refusee");

    fiche.append(titre, details, description, valider, refuser);
    zone.appendChild(fiche);
  });
}

// Validation ou refus d'une randonnée
async function changerStatut(id, statut) {
  if (!client) return;

  const { data: userData } = await client.auth.getUser();

  if (!userData.user || userData.user.id !== ADMIN_ID) {
    alert("Accès réservé à l'administrateur.");
    return;
  }

  const { error } = await client
    .from("Sorties")
    .update({ Statut: statut })
    .eq("id", id);

  if (error) {
    alert("Erreur : " + error.message);
    return;
  }

  alert(statut === "publie"
    ? "Randonnée validée !"
    : "Randonnée refusée.");

  await loadPropositions();
  await loadSorties();
}

// Actualisation de l'espace après connexion
async function actualiserEspace() {
  await loadSorties();
  await loadPropositions();
}

// Au chargement du site
if (client) {
  client.auth.onAuthStateChange(() => {
    setTimeout(actualiserEspace, 0);
  });

  actualiserEspace();
}

document.getElementById("form-sortie")?.addEventListener("submit", async function(e) {
  e.preventDefault();

  const message = document.getElementById("message-sortie");
  message.textContent = "Envoi en cours...";

  if (!client) {
    message.textContent = "Connexion à Supabase impossible.";
    return;
  }

  const { data: userData } = await client.auth.getUser();
  const user = userData.user;

  if (!user) {
    message.textContent = "Connectez-vous avant de proposer une randonnée.";
    return;
  }

  const sortie = {
    Titre: document.getElementById("titre-sortie").value.trim(),
    Discipline: document.getElementById("discipline-sortie").value,
    Description: document.getElementById("description-sortie").value.trim(),
    Date_sortie: document.getElementById("date-sortie").value,
    Heure: document.getElementById("heure-sortie").value,
    Lieu: document.getElementById("lieu-sortie").value.trim(),
    Département: document.getElementById("departement-sortie").value.trim(),
    Organisateur_id: user.id,
    Prix: document.getElementById("prix-sortie").value.trim(),
    Contact: document.getElementById("contact-sortie").value.trim(),
    Statut: "en_attente"
  };

  const { error } = await client
    .from("Sorties")
    .insert([sortie]);

  if (error) {
    message.textContent = "Erreur : " + error.message;
    return;
  }

  message.textContent = "Proposition envoyée ! Elle sera vérifiée avant publication.";
  this.reset();
  await loadPropositions();
});

