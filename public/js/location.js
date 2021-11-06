const myLat = document.querySelector("#myLat");
const myLong = document.querySelector("#myLong");

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
        myLat.innerHTML += position.coords.latitude;
        myLong.innerHTML += position.coords.longitude;
    });
}
else {
    console.log("Geo location is not supported");
}