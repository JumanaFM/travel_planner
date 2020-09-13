const geonamesApiUser = "aljumana";
const geonamesBaseURL = `http://api.geonames.org/searchJSON?username=${geonamesApiUser}&q=`;

const weatherbitApiKey = "a9308b38205c4e4ab03c7e877f78e6ef";
const weatherbitForecastBaseURL = `https://api.weatherbit.io/v2.0/forecast/daily?key=${weatherbitApiKey}&`;
const weatherbitHistoricalBaseURL = `https://api.weatherbit.io/v2.0/history/daily?key=${weatherbitApiKey}&`;

const pixabayApiKey = "18285154-9d570dafcdfec7da528e133f8";
const pixabayBaseURL = `https://pixabay.com/api/?key=${pixabayApiKey}&image_type=photo&pretty=true&category=places&q=`;


export async function handleSubmit(event) {
    event.preventDefault();
    document.body.classList.add("loading");
    clearLastResult()

    try {
        const city = document.getElementById("city").value
        const startDate = document.getElementById("date-start").value
        const endDate = document.getElementById("date-end").value

        if (validateInput(city, startDate, endDate)) {
            const ds = new Date(startDate)
            const de = new Date(endDate)

            // inspired from https://stackoverflow.com/a/3224854/1691550
            const diffTime = Math.abs(ds - de);
            const duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const cityInfo = await getCityInfo(city)
            const weather = await getWeather(ds, cityInfo.lat, cityInfo.lng)
            const img = await getImage(city)
            await save(img, city, cityInfo.countryName, weather, duration)
            setResult(img, city, cityInfo.countryName, weather, duration)
        }
    } catch (e) {
        showError("Error while getting information")
        console.error(e);
    } finally {
        document.body.classList.remove("loading");
    }
}

async function getCityInfo(city) {
    const geonamesResponse = await fetch(geonamesBaseURL + city)
    const geonamesResponseJson = await geonamesResponse.json()
    return geonamesResponseJson.geonames[0]
}

async function getWeather(date, lat, lng) {
    // inspired from https://stackoverflow.com/a/3224854/1691550
    const diffTime = Math.abs(date - new Date());
    const daysToTravel = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysToTravel < 15) {
        const weatherbitResponse = await fetch(weatherbitForecastBaseURL + `&lat=${lat}&lon=${lng}`)
        const weatherbitResponseJson = await weatherbitResponse.json()
        return weatherbitResponseJson.data[daysToTravel].temp
    } else {
        // inspired from https://stackoverflow.com/a/2013332/1691550
        let month = date.getUTCMonth() + 1; //months from 1-12
        let day = date.getUTCDate();
        let year = date.getUTCFullYear();
        const weatherbitResponse = await fetch(weatherbitHistoricalBaseURL + `&lat=${lat}&lon=${lng}&start_date=${year-1}-${month}-${day}&end_date=${year-1}-${month}-${day+1}`)
        const weatherbitResponseJson = await weatherbitResponse.json()
        return weatherbitResponseJson.data[0].temp
    }
}

async function getImage(city) {
    const pixabayResponse = await fetch(pixabayBaseURL + city)
    const pixabayResponseJson = await pixabayResponse.json()
    return pixabayResponseJson.hits[0].largeImageURL
}

function validateInput(city, startDate, endDate) {
    if (city.length < 1) {
        showError("Error: City should be present!")
        return false
    }

    let ds = new Date(startDate)
    let de = new Date(endDate)

    if (!(ds instanceof Date && !isNaN(ds)) || startDate.length != 10) {
        showError("Error: Start date should be on the format MM/DD/YYYY")
        return false
    }

    if (!(de instanceof Date && !isNaN(de)) || endDate.length != 10) {
        showError("Error: End date should be on the format MM/DD/YYYY")
        return false
    }

    return true;
}

async function save(imgURL, city, country, weather, duration) {
    let d = { imgURL, city, country, weather, duration }
        // Code inspired from https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    const response = await fetch("http://localhost:8081/entry", {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, *cors, same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "same-origin", // include, *same-origin, omit
        headers: {
            "Content-Type": "application/json",
        },
        redirect: "follow", // manual, *follow, error
        referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(d),
    });

}

function setResult(imgURL, city, country, weather, duration) {
    document.getElementById("travel-img").src = imgURL;
    document.getElementById("travel-name").innerHTML = `${city}, ${country}`;
    document.getElementById("travel-weather").innerHTML = `${weather} °`;
    document.getElementById("travel-duration").innerHTML = `${duration} Days`;
    document.getElementById("travel-result").style.display = 'flex'
}

function clearLastResult() {
    document.getElementById("travel-result").style.display = 'none'
    document.getElementById("error-msg").innerHTML = "";
    document.getElementById("travel-img").src = "";
    document.getElementById("travel-name").innerHTML = "";
    document.getElementById("travel-weather").innerHTML = "";
    document.getElementById("travel-duration").innerHTML = "";
}

function showError(msg) {
    document.getElementById("error-msg").innerHTML = msg;
}