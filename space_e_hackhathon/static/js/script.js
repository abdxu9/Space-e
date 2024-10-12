const url = 'https://opendata.clermontmetropole.eu/api/explore/v2.1/catalog/datasets/parcs-et-jardins-ville-de-clermont-ferrand/records?';
let type = ["Espace vert public de proximité","Parc urbain public"];
        
function whereSingle(text) {
    return `where=%22${text}%22`;
}

// Function to create the where clause for multiple types
function whereMultiple(types, operator = "OR") {
    // Map each type to its URL-encoded representation and join them with the specified operator
    const conditions = types.map(text => `%22${text}%22`).join(` ${operator} `);
    return `where=${conditions}`;
}


fetch(url +whereMultiple(type), {
    method: 'GET',
    mode: 'cors'
})

.then(function(response) {
if (response.headers.get('content-type') && response.headers.get('content-type').includes('application/json')) {
    return response.json(); // Parse the response as JSON
} else {
    return response.text(); // Fallback in case it's not JSON
}
})
.then(function(data){
    console.log(data); // Check the returned JSON data
})
.catch(function(err) {
    console.error('Fetch error: ', err); // Handle any errors
});


async function getLocationAndCallAPI() {
try {
    // Get current location
    const position = await getCurrentLocation();

    // Extract latitude and longitude from Geolocation API
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    console.log("Current Location: ", latitude, longitude);

    // Prepare query params for GraphHopper
    const query = new URLSearchParams({
    key: 'cf3d916c-ca66-43f1-9889-d5efbc56d457'  // Replace with your GraphHopper API key
    }).toString();

    // Call GraphHopper API with the fetched location
    const resp = await fetch(
    `https://graphhopper.com/api/1/matrix?${query}`,
    {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        from_points: [
            [longitude, latitude]  // Use current location as a starting point
        ],
        to_points: [
            [3.08743, 45.77116]
        ],
        from_point_hints: ['Current Location'],  // Label for the current location
        to_point_hints: ['lecoq'],
        out_arrays: ['weights', 'times', 'distances'], //return times in secondes
        vehicle: 'car'
        })
    }
    );

    const data = await resp.json();
    console.log('GraphHopper Response:', data);

} catch (error) {
    console.error('Error:', error);
}
}

// Helper function to wrap the Geolocation API in a Promise
function getCurrentLocation() {
return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(resolve, reject);
    } else {
    reject(new Error("Geolocation is not supported by this browser."));
    }
});
}

// Call the function
getLocationAndCallAPI();

async function getLocationAndCallRoutingAPI() {
    try {
      // Step 1: Get current location (latitude, longitude)
      const position = await getCurrentLocation();
  
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
  
      console.log("User's Current Location:", latitude, longitude);
  
      // Step 2: Create the URL query string for the GraphHopper API
      const query = new URLSearchParams({
        key: 'cf3d916c-ca66-43f1-9889-d5efbc56d457'  // Replace with your actual GraphHopper API key
      }).toString();
  
      // Step 3: Send POST request to GraphHopper Routing API
      const resp = await fetch(
        `https://graphhopper.com/api/1/route?${query}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            profile: 'car',  // The vehicle type, e.g., car, bike, foot, etc.
            points: [
              [longitude, latitude], // User's current location as the start point
              [3.08743, 45.77116]    // Example destination point (replace as needed)
            ],
            point_hints: [
              'Lindenschmitstraße',  // Optional hints for route snapping
              'Thalkirchener Str.'
            ],
            snap_preventions: [
              'motorway',  // Avoid motorways, ferries, and tunnels
              'ferry',
              'tunnel'
            ],
            details: ['road_class', 'surface']  // Additional route details
          })
        }
      );
  
      // Step 4: Await the JSON response from GraphHopper API
      const data = await resp.json();
      console.log('GraphHopper Route Data:', data);
  
    } catch (error) {
      console.error('Error occurred:', error);
    }
  }
  
  // Helper function to get current location via Geolocation API
  function getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      } else {
        reject(new Error("Geolocation is not supported by this browser."));
      }
    });
  }
  
  // Call the function to get location and call the API
getLocationAndCallRoutingAPI();
  



