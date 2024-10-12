const url = 'https://opendata.clermontmetropole.eu/api/records/1.0/search/?dataset=parcs-et-jardins-ville-de-clermont-ferrand&rows=10&sort=type';
    
fetch(url, {
    method: 'GET',
    mode: 'cors'
})
.then(function(response) {
    return response.json(); // Parse the response as JSON
})
.then(function(data){
    console.log(data); // Check the returned JSON data
})
.catch(function(err) {
    console.error('Fetch error: ', err); // Handle any errors
});