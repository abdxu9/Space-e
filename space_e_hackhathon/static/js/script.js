/* Requête pour avoir les parcs et leurs données */
const url = 'https://opendata.clermontmetropole.eu/api/explore/v2.1/catalog/datasets/parcs-et-jardins-ville-de-clermont-ferrand/records?select=surface%2Cnom%2Ctype%2Cgeo_point_2d&';
function whereSingle(text) {
 return `where=%22${text}%22&limit=96`;
}

const apiKey = 'cf3d916c-ca66-43f1-9889-d5efbc56d457'; // Votre clé API GraphHopper

let locPark = [];
let namePark = [];
const position = [3.080452, 45.778317]; // Coordonnées actuelles (simulées)

// Appel unique avec fetch pour gérer tout le flux
fetch(url + whereSingle("Espace vert public de proximité"), {
 method: 'GET',
 mode: 'cors'
})
.then(response => response.json())
.then(data => {
 // Traitement des données des parcs
 if (data.total_count && data.results) {
   for (let i = 0; i < data.total_count; i++) {
     locPark.push([data.results[i].geo_point_2d.lon, data.results[i].geo_point_2d.lat]);
     namePark.push(data.results[i].nom);
   }
 }

 console.log('Parcs localisés :', locPark);
 console.log('Noms des parcs :', namePark);
 console.log("Position actuelle : ", position);

 return fetch(`https://graphhopper.com/api/1/matrix?key=${apiKey}`, {
   method: 'POST',
   headers: {
     'Content-Type': 'application/json'
   },
   body: JSON.stringify({
     profile: 'foot',
     from_points: [position], // Coordonnées actuelles
     to_points: locPark, // Points des parcs
     from_point_hints: ['Position actuelle'],
     to_point_hints: namePark,
     out_arrays: ['times', 'distances'] // Retourne les temps et les distances
   })
 });
})
.then(response => response.json())
.then(data => {
 // Traitement des données de distance
 console.log('Réponse de GraphHopper (Matrix API) :', data);

 // Calcul des 5 plus courtes distances
 let listeAvecIndex = data.times[0].map((valeur, index) => ({ valeur, index }));
 let listeTriee = listeAvecIndex.sort((a, b) => a.valeur - b.valeur);
 let cinqMin = listeTriee.slice(0, 5);
 console.log('Top 5 des distances les plus courtes :', cinqMin);

 if (cinqMin.length > 0) {
  const selectedParkIndex = [];
  for (let i = 0; i < 5; i++) {
    selectedParkIndex.push(cinqMin[i].index);
  }
  console.log("Park indices:", selectedParkIndex);
  console.log("minc:", cinqMin);

  const selectedPark = [];
  for (let i = 0; i < 5; i++) {
    selectedPark.push(locPark[selectedParkIndex[i]]);
  }
  console.log("Selected parks:", selectedPark);

  // Initialiser une seule carte avec Leaflet
  const map = L.map('map').setView([position[1], position[0]], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Ajouter un marqueur pour la position actuelle
  L.marker([position[1], position[0]])
    .addTo(map)
    .bindPopup('Position actuelle')
    .openPopup();

  // Ajouter des marqueurs pour tous les parcs avec des icônes colorées
  const addedParks = new Set();
  locPark.forEach((park, index) => {
    const lat = park[1];
    const lon = park[0];
    const parkName = namePark[index];
    const parkKey = `${lat},${lon}`;

    if (!addedParks.has(parkKey)) {
      // Définir la capacité maximale du parc
      const capacity = 100;
      // Simuler une occupation entre 0% et 100%
      const currentOccupancy = Math.floor(Math.random() * (capacity + 1));
      const occupancyPercentage = Math.floor((currentOccupancy / capacity) * 100);

      // Déterminer la couleur en fonction de l'occupation
      let iconColor;
      if (occupancyPercentage > 80) {
        iconColor = 'red';
      } else if (occupancyPercentage > 60) {
        iconColor = 'yellow';
      } else {
        iconColor = 'green';
      }

      const parkIcon = L.icon({
        iconUrl: `../static/forest_${iconColor}.png`,
        iconSize: [32, 37],
        iconAnchor: [16, 37],
        popupAnchor: [0, -28]
      });

      L.marker([lat, lon], { icon: parkIcon })
        .addTo(map)
        .bindPopup(`<b>${parkName}</b><br>Occupation : ${occupancyPercentage}%`);

      addedParks.add(parkKey);
    }
  });

  // Itérer à travers les 5 parcs sélectionnés pour afficher les itinéraires
  const promises = [];
  for (let i = 0; i < 5; i++) {
    const parkPosition = selectedPark[i];
    const color = ['blue', 'red', 'green', 'orange', 'purple'][i]; // Couleurs différentes pour chaque itinéraire
    
    const apiCall = fetch(`https://graphhopper.com/api/1/route?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        profile: 'foot',
        points: [position, parkPosition], // De la position actuelle au parc sélectionné
        point_hints: ['Position actuelle', `Parc sélectionné ${i+1}`],
        details: ['road_class', 'surface', 'time'],
        points_encoded: false
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log(`Réponse de GraphHopper pour le parc ${i+1} :`, data);
  
      if (data.paths && data.paths.length > 0) {
        const routeCoordinates = data.paths[0].points.coordinates.map(point => [point[1], point[0]]);
  
        // Tracer l'itinéraire sur la carte avec une couleur différente
        const routeLine = L.polyline(routeCoordinates, { color: color }).addTo(map);
        map.fitBounds(routeLine.getBounds()); // Ajuster la vue pour montrer l'itinéraire
      } else {
        throw new Error(`Aucun itinéraire valide trouvé pour le parc ${i+1}`);
      }
    })
    .catch(error => {
      console.error(`Erreur lors du traitement de l'itinéraire pour le parc ${i+1} :`, error);
    });
  
    // Ajouter la promesse de l'API à une liste pour exécuter les appels en parallèle
    promises.push(apiCall);
  }

  // Attendre que toutes les promesses soient terminées
  Promise.all(promises)
    .then(() => {
      console.log("Tous les itinéraires ont été tracés sur la carte.");
    })
    .catch(error => {
      console.error("Erreur lors du traitement des itinéraires :", error);
    });

} else {
  throw new Error('Aucun parc disponible pour l\'itinéraire');
}
});