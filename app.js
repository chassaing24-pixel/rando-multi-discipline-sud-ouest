
const cfg = window.SUPABASE_CONFIG || {};
const client = (window.supabase && cfg.url && cfg.anonKey)
  ? window.supabase.createClient(cfg.url, cfg.anonKey)
  : null;

// Identifiant du compte administrateur
const ADMIN_ID = "4a71660b-f732-4bb2-9653-9fc7a059c348";

// Connexion et inscription
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

// Affichage des détails d'une randonnée
function ajouterDetail(contenu, label, valeur) {
  const ligne = document.createElement("p");
  const titre = document.createElement("strong");

  titre.textContent = label + " : ";
  ligne.append(titre, document.createTextNode(valeur || "Non précisé"));
  contenu.appendChild(ligne);
}

// Affichage des randonnées publiées

async function loadSorties() {
  const zone = document.querySelector("#sorties .notice");
  if (!zone || !client) return;

  zone.textContent = "Chargement des randonnées...";

  const { data, error } = await client
    .from("Sorties")
    .select("*")
    .eq("Statut", "publie")
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

    // Photo de couverture
    const photos = Array.isArray(sortie.Photos)
      ? sortie.Photos
      : [];

    if (photos.length > 0) {
      const image = document.createElement("img");
      image.src = photos[0];
      image.alt = "Photo de la randonnée";
      image.style.width = "100%";
      image.style.height = "200px";
      image.style.objectFit = "cover";
      image.style.borderRadius = "14px";
      image.style.marginBottom = "15px";
      fiche.appendChild(image);
    }
// Badge de la discipline
const badgeDiscipline = document.createElement("span");
badgeDiscipline.textContent = sortie.Discipline || "Randonnée";
badgeDiscipline.className = "badge-discipline";

fiche.appendChild(badgeDiscipline);
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

    const boutonDetails = document.createElement("button");
    boutonDetails.textContent = "Voir les détails";
    boutonDetails.className = "btn orange";

    boutonDetails.onclick = () => {
      const modal = document.getElementById("fenetre-details");
      const contenu = document.getElementById("contenu-details");

      if (!modal || !contenu) return;

      contenu.replaceChildren();

      const titreModal = document.createElement("h2");
      titreModal.textContent = sortie.Titre || "Randonnée";
      contenu.appendChild(titreModal);

      ajouterDetail(contenu, "Discipline", sortie.Discipline);
      ajouterDetail(contenu, "Date", sortie.Date_sortie);
      ajouterDetail(contenu, "Lieu", sortie.Lieu);
      ajouterDetail(contenu, "Description", sortie.Description);
      ajouterDetail(contenu, "Départ", sortie.Heure);
      ajouterDetail(contenu, "Département", sortie.Département);
      ajouterDetail(contenu, "Prix", sortie.Prix);
      ajouterDetail(contenu, "Contact", sortie.Contact);

      if (photos.length > 0) {
        const titrePhotos = document.createElement("h3");
        titrePhotos.textContent = "Photos de la randonnée";
        contenu.appendChild(titrePhotos);

        photos.forEach(url => {
          const image = document.createElement("img");
          image.src = url;
          image.alt = "Photo de la randonnée";
          image.style.width = "100%";
          image.style.maxWidth = "250px";
          image.style.margin = "8px";
          image.style.borderRadius = "12px";
          contenu.appendChild(image);
        });
      }

      modal.style.display = "block";
    };

    fiche.append(titre, details, description, infos, boutonDetails);
    zone.appendChild(fiche);
  });
}

document.getElementById("fermer-details")?.addEventListener("click", () => {
  document.getElementById("fenetre-details").style.display = "none";
});

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

    fiche.append(titre, details, description);

    if (Array.isArray(sortie.Photos)) {
      sortie.Photos.forEach(url => {
        const image = document.createElement("img");
        image.src = url;
        image.alt = "Photo proposée";
        image.style.width = "100%";
        image.style.maxWidth = "180px";
        image.style.margin = "5px";
        fiche.appendChild(image);
      });
    }

    fiche.append(valider, refuser);
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

// Formulaire de proposition d'une randonnée
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

  const champPhotos = document.getElementById("photos-sortie");
  const fichiers = champPhotos ? Array.from(champPhotos.files) : [];
  const photos = [];

  // Envoi des photos dans Supabase Storage
  for (let i = 0; i < fichiers.length; i++) {
    const fichier = fichiers[i];

    if (!fichier.type.startsWith("image/")) {
      message.textContent = "Un fichier sélectionné n'est pas une image.";
      return;
    }

    const nomSecurise = fichier.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const chemin = user.id + "/" + Date.now() + "-" + i + "-" + nomSecurise;

    const { error: erreurPhoto } = await client.storage
      .from("photos-randonnees")
      .upload(chemin, fichier, {
        upsert: false,
        contentType: fichier.type
      });

    if (erreurPhoto) {
      message.textContent = "Erreur lors de l'envoi d'une photo : " + erreurPhoto.message;
      return;
    }

    const { data: urlPhoto } = client.storage
      .from("photos-randonnees")
      .getPublicUrl(chemin);

    photos.push(urlPhoto.publicUrl);
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
    Photos: photos,
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


