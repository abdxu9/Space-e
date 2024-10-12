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