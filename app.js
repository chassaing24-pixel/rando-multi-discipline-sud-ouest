
const cfg = window.SUPABASE_CONFIG || {};

let disciplineActive = "Toutes";
let rechercheDepartement = "";
const client = (window.supabase && cfg.url && cfg.anonKey)
  ? window.supabase.createClient(cfg.url, cfg.anonKey)
  : null;

// Afficher le champ du lien externe selon le mode d'inscription
const modeInscriptionSelect = document.getElementById("mode-inscription-sortie");
const zoneLienInscription = document.getElementById("zone-lien-inscription");

if (modeInscriptionSelect && zoneLienInscription) {
  const afficherZoneLien = () => {
    zoneLienInscription.style.display =
      modeInscriptionSelect.value === "lien" ? "block" : "none";
  };

  modeInscriptionSelect.addEventListener("change", afficherZoneLien);
  afficherZoneLien();
}

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

  afficherCalendrier(data);

  if (!data || data.length === 0) {
    zone.textContent = "Aucune randonnée publiée pour le moment.";
    return;
  }

    const normaliser = valeur => (valeur || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  const sortiesFiltrees = data.filter(sortie => {
    const disciplineOK =
      disciplineActive === "Toutes" ||
      normaliser(sortie.Discipline).includes(normaliser(disciplineActive));

    const departement = normaliser(sortie.Departement);

    const rechercheOK =
      !rechercheDepartement ||
      departement.includes(normaliser(rechercheDepartement));

    return disciplineOK && rechercheOK;
  });

  if (sortiesFiltrees.length === 0) {
    zone.textContent = "Aucune randonnée ne correspond à votre recherche.";
    return;
  }

  sortiesFiltrees.forEach(sortie => {
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
const iconesDisciplines = {
  "équestre": "🐎",
  "pédestre": "🥾",
  "vtt": "🚵",
  "trail": "🏃"
};

const nomDiscipline = sortie.Discipline || "Randonnée";
const disciplinePourIcone = nomDiscipline.toLowerCase();

let icone = "🌿";

if (disciplinePourIcone.includes("équestre")) icone = "🐎";
else if (disciplinePourIcone.includes("pédestre")) icone = "🥾";
else if (disciplinePourIcone.includes("vtt")) icone = "🚵";
else if (disciplinePourIcone.includes("trail")) icone = "🏃";

badgeDiscipline.textContent = icone + " " + nomDiscipline;
const discipline = (sortie.Discipline || "").toLowerCase();

badgeDiscipline.className = "badge-discipline";

if (discipline.includes("équestre")) {
  badgeDiscipline.classList.add("badge-equestre");
} else if (discipline.includes("pédestre")) {
  badgeDiscipline.classList.add("badge-pedestre");
} else if (discipline.includes("vtt")) {
  badgeDiscipline.classList.add("badge-vtt");
} else if (discipline.includes("trail")) {
  badgeDiscipline.classList.add("badge-trail");
}

fiche.appendChild(badgeDiscipline);
    const titre = document.createElement("h3");
    titre.textContent = sortie.Titre || "Randonnée";

 const details = document.createElement("p");

details.textContent =
  "📅 " + (sortie.Date_sortie || "Date à préciser") + " · " +
  "📍 " + (sortie.Lieu || "Lieu à préciser") + " · " +
  "Département(s) : " + (sortie.Departement || "Non renseigné");


    const description = document.createElement("p");
    description.textContent = sortie.Description || "";

    const boutonDetails = document.createElement("button");
    boutonDetails.textContent = "Voir les détails";
    boutonDetails.className = "btn orange";

    boutonDetails.dataset.sortieId = sortie.id;
    
boutonDetails.onclick = () => {
  const modal = document.getElementById("fenetre-details");
  const contenu = document.getElementById("contenu-details");
  const formulaireInscription = document.getElementById("formulaire-inscription");
  const formInscription = document.getElementById("form-inscription");
  const messageInscription = document.getElementById("message-inscription");

  if (!modal || !contenu) return;

  contenu.replaceChildren();

  // Réinitialiser le formulaire d'inscription
  if (formulaireInscription) formulaireInscription.style.display = "none";
  if (formInscription) formInscription.reset();
  if (messageInscription) messageInscription.textContent = "";

  const titreModal = document.createElement("h2");
  titreModal.textContent = sortie.Titre || "Randonnée";
  contenu.appendChild(titreModal);

  ajouterDetail(contenu, "Discipline", sortie.Discipline);
  ajouterDetail(contenu, "Date", sortie.Date_sortie);
  ajouterDetail(contenu, "Lieu", sortie.Lieu);
  ajouterDetail(contenu, "Description", sortie.Description);
  ajouterDetail(contenu, "Téléphone", sortie.Telephone);
  ajouterDetail(contenu, "Département", sortie.Departement);
  ajouterDetail(contenu, "Prix", sortie.Prix);
  ajouterDetail(contenu, "Contact", sortie.Contact);

  // Afficher les photos
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

  // Choisir le mode d'inscription
  if (sortie.Mode_inscription === "site") {
    const boutonInscription = document.createElement("button");
    boutonInscription.type = "button";
    boutonInscription.textContent = "S'inscrire à cette randonnée";
    boutonInscription.className = "btn orange";

    boutonInscription.addEventListener("click", () => {
      const champSortie = document.getElementById("inscription-sortie-id");

      if (champSortie) champSortie.value = sortie.id;

      if (formulaireInscription) {
        formulaireInscription.style.display = "block";
        boutonInscription.style.display = "none";
        formulaireInscription.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    });

    contenu.appendChild(boutonInscription);

  } else if (sortie.Mode_inscription === "lien" && sortie.lien_inscription) {
    try {
      const url = new URL(sortie.lien_inscription);

      if (["http:", "https:"].includes(url.protocol)) {
        const lien = document.createElement("a");
        lien.href = url.href;
        lien.target = "_blank";
        lien.rel = "noopener noreferrer";
      lien.textContent = "S'inscrire et payer";
        lien.className = "btn orange";
        contenu.appendChild(lien);
      } else {
        ajouterDetail(contenu, "Inscription", "Lien d'inscription invalide.");
      }
    } catch (e) {
      ajouterDetail(contenu, "Inscription", "Lien d'inscription invalide.");
    }

  } else {
    ajouterDetail(
      contenu,
      "Inscription",
      "Aucune inscription en ligne. Contactez l'organisateur."
    );
  }

  modal.style.setProperty("display", "flex", "important");
  document.body.style.overflow = "hidden";
};

      
    const boutonPartager = document.createElement("button");
boutonPartager.textContent = "📤 Partager cette randonnée";
boutonPartager.className = "btn";
boutonPartager.type = "button";

boutonPartager.onclick = async () => {
  const partage = {
    title: sortie.Titre || "Randonnée",
    text: `Découvre cette randonnée : ${sortie.Titre || "Randonnée"}`,
    url: window.location.href
  };
  if (navigator.share) {
    try {
      await navigator.share(partage);
    } catch (erreur) {
      if (erreur.name !== "AbortError") {
        alert("Le partage n'a pas pu être effectué.");
      }
    }
  } else {
    try {
      await navigator.clipboard.writeText(
        partage.text + " " + partage.url
      );
      alert("Lien copié ! Tu peux le partager.");
    } catch (erreur) {
      alert("Impossible de copier le lien.");
    }
  }
  };

fiche.append(titre, details, description, boutonDetails, boutonPartager);
zone.appendChild(fiche);
});
}

// Filtres des disciplines
document.querySelectorAll(".filtres-discipline button").forEach(bouton => {
  bouton.addEventListener("click", () => {
    disciplineActive = bouton.dataset.discipline;

    document.querySelectorAll(".filtres-discipline button").forEach(b => {
      b.classList.remove("filtre-actif");
    });

    bouton.classList.add("filtre-actif");

    loadSorties();
  });
});
// Recherche par département
document.getElementById("recherche-departement")
  ?.addEventListener("input", event => {
    rechercheDepartement = event.target.value.trim();
    loadSorties();
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
  (sortie.Lieu || "") + " · " +
  "Département(s) : " + (sortie.Departement || "Non renseigné");

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
  await loadInscriptions();
 await loadInscriptionsOrganisateur();
}


async function loadInscriptions() {
  const zone = document.getElementById("inscriptions-recues");

  if (!zone || !client) return;

  const { data: userData } = await client.auth.getUser();
  const user = userData.user;

  if (!user || user.id !== ADMIN_ID) return;

  zone.textContent = "Chargement des inscriptions...";

  const { data, error } = await client
    .from("inscriptions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    zone.textContent = "Erreur : " + error.message;
    return;
  }

  zone.replaceChildren();

  if (!data || data.length === 0) {
    zone.textContent = "Aucune inscription reçue pour le moment.";
    return;
  }

  const { data: sorties, error: erreurSorties } = await client
    .from("Sorties")
    .select("id, Titre");

  if (erreurSorties) {
    zone.textContent = "Erreur de chargement des randonnées : " + erreurSorties.message;
    return;
  }

  const titresSorties = new Map(
    (sorties || []).map(s => [String(s.id), s.Titre])
  );

  for (const inscription of data) {
    const fiche = document.createElement("article");
    fiche.className = "sortie-card";

    const titre = document.createElement("h3");
    titre.textContent =
      titresSorties.get(String(inscription.sortie_id)) || "Randonnée";

    const infos = document.createElement("p");
    infos.textContent =
      "Participant : " + inscription.prenom + " " + inscription.nom +
      " · E-mail : " + inscription.email +
      " · Téléphone : " + (inscription.telephone || "Non renseigné") +
      " · Participants : " + inscription.nombre_participants;

    const message = document.createElement("p");
    message.textContent = inscription.message || "Aucun message.";

    fiche.append(titre, infos, message);

    const documents = Array.isArray(inscription.documents)
      ? inscription.documents
      : [];

    for (const chemin of documents) {
      const { data: fichier, error: erreurFichier } =
        await client.storage
          .from("documents-inscriptions")
          .createSignedUrl(chemin, 3600);

      if (erreurFichier) {
        const erreur = document.createElement("p");
        erreur.textContent = "Document inaccessible : " + chemin;
        fiche.appendChild(erreur);
        continue;
      }

      const lien = document.createElement("a");
      lien.href = fichier.signedUrl;
      lien.target = "_blank";
      lien.rel = "noopener noreferrer";
      lien.textContent = "Consulter un document";
      fiche.appendChild(lien);
    }

    zone.appendChild(fiche);
  }
}


async function loadInscriptionsOrganisateur() {
  const zone = document.getElementById("inscriptions-organisateur");
  const espace = document.getElementById("espace-organisateur");

  if (!zone || !client) return;

  const { data: userData } = await client.auth.getUser();
  const user = userData?.user;

  if (!user) {
    espace.style.display = "none";
    return;
  }

  espace.style.display = "block";
  zone.textContent = "Chargement de vos inscriptions...";

  const { data: sorties, error: erreurSorties } = await client
    .from("Sorties")
    .select("id, Titre")
    .eq("Organisateur_id", user.id);

  if (erreurSorties) {
    zone.textContent = "Erreur : " + erreurSorties.message;
    return;
  }

  if (!sorties || sorties.length === 0) {
    zone.textContent = "Vous n'avez pas encore proposé de randonnée.";
    return;
  }

  const idsSorties = sorties.map(sortie => sortie.id);
  const titresSorties = Object.fromEntries(
    sorties.map(sortie => [sortie.id, sortie.Titre])
  );

  const { data: inscriptions, error: erreurInscriptions } = await client
    .from("inscriptions")
    .select("*")
    .in("sortie_id", idsSorties)
    .order("created_at", { ascending: false });

  if (erreurInscriptions) {
    zone.textContent = "Erreur de chargement : " + erreurInscriptions.message;
    return;
  }

  zone.replaceChildren();

  if (!inscriptions || inscriptions.length === 0) {
    zone.textContent = "Aucune inscription reçue pour vos randonnées.";
    return;
  }

  for (const inscription of inscriptions) {
    const fiche = document.createElement("div");
    fiche.className = "carte-sortie";

    const titre = document.createElement("h3");
    titre.textContent = titresSorties[inscription.sortie_id] || "Randonnée";
    fiche.appendChild(titre);

    const details = [
      "Nom : " + inscription.nom,
      "Prénom : " + inscription.prenom,
      "E-mail : " + inscription.email,
      "Téléphone : " + (inscription.telephone || "Non renseigné"),
      "Participants : " + inscription.nombre_participants,
      "Message : " + (inscription.message || "Aucun")
    ];

    details.forEach(detail => {
      const ligne = document.createElement("p");
      ligne.textContent = detail;
      fiche.appendChild(ligne);
    });

    for (const chemin of inscription.documents || []) {
      const { data, error } = await client.storage
        .from("documents-inscriptions")
        .createSignedUrl(chemin, 3600);

      if (!error && data?.signedUrl) {
        const lien = document.createElement("a");
        lien.href = data.signedUrl;
        lien.target = "_blank";
        lien.rel = "noopener noreferrer";
        lien.textContent = "Consulter un document";
        fiche.appendChild(lien);
      }
    }

    zone.appendChild(fiche);
  }
}

// Au chargement du site
if (client) {
  client.auth.onAuthStateChange(() => {
    setTimeout(actualiserEspace, 0);
  });

  actualiserEspace();
}
// Ouvrir et refermer le formulaire de randonnée
const boutonFormulaire = document.getElementById("ouvrir-formulaire-sortie");
const formulaireSortie = document.getElementById("form-sortie");

boutonFormulaire?.addEventListener("click", () => {
  formulaireSortie.hidden = !formulaireSortie.hidden;

  boutonFormulaire.textContent = formulaireSortie.hidden
    ? "+ Proposer une randonnée"
    : "− Fermer le formulaire";
});

// Formulaire de proposition d'une randonné
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
  const champDocuments = document.getElementById("documents-sortie");
const fichiersDocuments = champDocuments
  ? Array.from(champDocuments.files)
  : [];

const documents = [];
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
  // Envoi des documents dans Supabase Storage
  for (let i = 0; i < fichiersDocuments.length; i++) {
    const fichier = fichiersDocuments[i];

    const nomSecurise = fichier.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const chemin = user.id + "/" + Date.now() + "-" + i + "-" + nomSecurise;

    const { error: erreurDocument } = await client.storage
      .from("documents-randonnees")
      .upload(chemin, fichier, {
        upsert: false,
        contentType: fichier.type
      });

    if (erreurDocument) {
      message.textContent = "Erreur lors de l'envoi d'un document : " + erreurDocument.message;
      return;
    }

    documents.push(chemin);
  }
  const disciplinesChoisies = Array.from(
  document.querySelectorAll('input[name="discipline-sortie"]:checked')
).map(input => input.value);

if (disciplinesChoisies.length === 0) {
  message.textContent = "Choisissez au moins une discipline.";
  return;
}
  const modeInscription = document.getElementById("mode-inscription-sortie").value;
const lienInscription = document.getElementById("lien-inscription-sortie").value.trim();

if (modeInscription === "lien" && !lienInscription) {
  message.textContent = "Veuillez renseigner le lien d'inscription.";
  return;
}

if (modeInscription === "lien") {
  try {
    const url = new URL(lienInscription);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Lien invalide");
    }
  } catch (e) {
    message.textContent = "Veuillez saisir une adresse de lien valide.";
    return;
  }
}

const sortie = {
  Mode_inscription: modeInscription,
 lien_inscription: modeInscription === "lien" ? lienInscription : null,
  Titre: document.getElementById("titre-sortie").value.trim(),
  Discipline: disciplinesChoisies.join(", "),
  Description: document.getElementById("description-sortie").value.trim(),
  Date_sortie: (() => {
    const [jour, mois, annee] = document.getElementById("date-sortie").value.split("/");
    return `${annee}-${mois}-${jour}`;
  })(),
  Lieu: document.getElementById("lieu-sortie").value.trim(),
  Departement: document.getElementById("departement-sortie").value.trim(),
  Organisateur_id: user.id,
  Prix: document.getElementById("prix-sortie").value.trim(),
  Contact: document.getElementById("contact-sortie").value.trim(),
  Telephone: document.getElementById("telephone-sortie").value.trim(),
  Photos: photos,
  Documents: documents,
  Statut: "en_attente"
};

  const { error } = await client
    .from("Sorties")
    .insert([sortie]);

  if (error) {
    message.textContent = "Erreur : " + error.message;
    return;
  }

  // Envoi de la notification à l'administratrice
  const { error: erreurEmail } = await client.functions.invoke(
    "notifier-admin-sortie",
    {
      body: {
        titre: sortie.Titre,
        discipline: sortie.Discipline,
        date: sortie.Date_sortie,
        lieu: sortie.Lieu,
        departement: sortie.Departement,
        contact: sortie.Contact
      }
    }
  );

  if (erreurEmail) {
    message.textContent =
      "Randonnée enregistrée, mais l'e-mail n'a pas pu être envoyé : " +
      erreurEmail.message;
  } else {
    message.textContent =
      "Proposition envoyée ! Un e-mail de notification a été déclenché. Elle sera vérifiée avant publication.";
  }

  this.reset();
  await loadPropositions();
  });

  
// CALENDRIER DES RANDONNEES
let moisCalendrier = new Date().getMonth();
let anneeCalendrier = new Date().getFullYear();

function afficherCalendrier(sorties) {
  const calendrier = document.getElementById("calendrier-sorties");
  if (!calendrier) return;

  const nomMois = [
    "Janvier", "Février", "Mars", "Avril",
    "Mai", "Juin", "Juillet", "Août",
    "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const premierJour = new Date(anneeCalendrier, moisCalendrier, 1);
  const nombreJours = new Date(anneeCalendrier, moisCalendrier + 1, 0).getDate();

  // Lundi = 0, dimanche = 6
  const decalage = (premierJour.getDay() + 6) % 7;

  let html = `
<div class="calendrier-navigation">
  <button id="mois-precedent" type="button">←</button>
  <h3>${nomMois[moisCalendrier]} ${anneeCalendrier}</h3>
  <button id="mois-suivant" type="button">→</button>
  <button id="mois-aujourd-hui" type="button">Aujourd'hui</button>
</div>

    <div class="calendrier-grille">
      <div class="jour-semaine">Lun</div>
      <div class="jour-semaine">Mar</div>
      <div class="jour-semaine">Mer</div>
      <div class="jour-semaine">Jeu</div>
      <div class="jour-semaine">Ven</div>
      <div class="jour-semaine">Sam</div>
      <div class="jour-semaine">Dim</div>
  `;

  for (let i = 0; i < decalage; i++) {
    html += `<div class="case-jour vide"></div>`;
  }

  const maintenant = new Date();

  for (let jour = 1; jour <= nombreJours; jour++) {

    const estAujourdHui =
      jour === maintenant.getDate() &&
      moisCalendrier === maintenant.getMonth() &&
      anneeCalendrier === maintenant.getFullYear();

    const dateRecherche = [
      anneeCalendrier,
      String(moisCalendrier + 1).padStart(2, "0"),
      String(jour).padStart(2, "0")
    ].join("-");

    const evenements = (sorties || []).filter(sortie =>
      sortie.Date_sortie === dateRecherche
    );

    html += `
      <div class="case-jour ${estAujourdHui ? "jour-aujourd-hui" : ""}">
        <strong>${jour}</strong>
     ${evenements.map(sortie => `

<button
  type="button"
  class="evenement-calendrier"
  data-sortie-id="${sortie.id}">
 
 ${sortie.Titre || "Randonnée"}
  </button>
`).join("")}
      </div>
    `;
  }

  html += `</div>`;

  calendrier.innerHTML = html;

  document.getElementById("mois-aujourd-hui")
  .addEventListener("click", () => {
    const maintenant = new Date();
    moisCalendrier = maintenant.getMonth();
    anneeCalendrier = maintenant.getFullYear();
    afficherCalendrier(sorties);
  });

calendrier.querySelectorAll(".evenement-calendrier").forEach(bouton => {
  bouton.addEventListener("click", () => {
    const id = bouton.dataset.sortieId;

    const boutonOriginal = document.querySelector(
      `.sortie-card button[data-sortie-id="${id}"]`
    );

    if (boutonOriginal) {
      boutonOriginal.click();
    }
  });
});
  document.getElementById("mois-precedent").addEventListener("click", () => {
    moisCalendrier--;
    if (moisCalendrier < 0) {
      moisCalendrier = 11;
      anneeCalendrier--;
    }
    afficherCalendrier(sorties);
  });

  document.getElementById("mois-suivant").addEventListener("click", () => {
    moisCalendrier++;
    if (moisCalendrier > 11) {
      moisCalendrier = 0;
      anneeCalendrier++;
    }
    afficherCalendrier(sorties);
  });
}
// FERMETURE DE LA FENETRE DETAILS
document.getElementById("fermer-details")
  ?.addEventListener("click", () => {
    const modal = document.getElementById("fenetre-details");

    if (modal) {
      modal.style.setProperty("display", "none", "important");
      document.body.style.overflow = "";
    }
  });
// INSCRIPTION A LA NEWSLETTER
document.getElementById("form-newsletter")
  ?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = document.getElementById("message-newsletter");

    if (!client) {
      message.textContent = "Service momentanément indisponible.";
      return;
    }

    const email = document.getElementById("newsletter-email").value.trim().toLowerCase();

    const departements = Array.from(
      document.querySelectorAll(".newsletter-departements input:checked")
    ).map(input => input.value);

    const disciplines = Array.from(
      document.querySelectorAll(".newsletter-disciplines input:checked")
    ).map(input => input.value);

    const consentement = document.getElementById("newsletter-consent").checked;

    if (departements.length === 0) {
      message.textContent = "Choisissez au moins un département.";
      return;
    }

    if (disciplines.length === 0) {
      message.textContent = "Choisissez au moins une discipline.";
      return;
    }

    if (!consentement) {
      message.textContent = "Veuillez accepter de recevoir les actualités par e-mail.";
      return;
    }

    message.textContent = "Inscription en cours...";

    
const { data, error } = await client.functions.invoke(
  "envoyer-newsletter",
  {
    body: {
      email: email,
      departements: departements,
      disciplines: disciplines,
      consentement: consentement
    }
  }
);

if (error) {
  console.error("Erreur newsletter :", error);

  let detail = error.message;

  try {
    const resultat = await error.context.json();
    detail = resultat.message || resultat.error || JSON.stringify(resultat);
  } catch (e) {
    console.error("Détail de l'erreur :", e);
  }

  message.textContent = detail;
  return;
}

message.textContent = data?.message ||
  "Consultez votre boîte e-mail pour confirmer votre inscription.";

document.getElementById("form-newsletter").reset();
  });

// INSCRIPTION DES PARTICIPANTS AUX RANDONNEES
document.getElementById("form-inscription")
  ?.addEventListener("submit", async function(event) {
    event.preventDefault();

    const message = document.getElementById("message-inscription");
    message.textContent = "Envoi de votre inscription en cours...";

    if (!client) {
      message.textContent = "Connexion au service impossible.";
      return;
    }

    const sortieId = Number(
      document.getElementById("inscription-sortie-id").value
    );

    const fichiers = Array.from(
      document.getElementById("inscription-documents").files
    );

    const documents = [];

    // Envoyer les documents dans le stockage privé
    for (let i = 0; i < fichiers.length; i++) {
      const fichier = fichiers[i];

      const nomSecurise = fichier.name.replace(
        /[^a-zA-Z0-9._-]/g, "_"
      );

      const chemin =
        sortieId + "/" + Date.now() + "-" + i + "-" + nomSecurise;

      const { error } = await client.storage
        .from("documents-inscriptions")
        .upload(chemin, fichier, {
          upsert: false,
          contentType: fichier.type || "application/octet-stream"
        });

      if (error) {
        message.textContent =
          "Erreur lors de l'envoi du document : " + error.message;
        return;
      }

      documents.push(chemin);
    }

    // Enregistrer l'inscription dans Supabase
    const inscription = {
      sortie_id: sortieId,
      nom: document.getElementById("inscription-nom").value.trim(),
      prenom: document.getElementById("inscription-prenom").value.trim(),
      email: document.getElementById("inscription-email").value.trim(),
      telephone: document.getElementById("inscription-telephone").value.trim(),
      nombre_participants: Number(
        document.getElementById("inscription-nombre").value
      ),
      message: document.getElementById("inscription-message").value.trim(),
      documents: documents,
      statut: "nouvelle"
    };

    const { error } = await client
      .from("inscriptions")
      .insert([inscription]);

    if (error) {
      message.textContent =
        "Erreur lors de l'inscription : " + error.message;
      return;
    }

    message.textContent =
      "Votre inscription a bien été envoyée ! Merci et à bientôt.";

    this.reset();
  });

