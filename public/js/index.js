let socket = io()
const myLatitude = document.querySelector("#myLat");
const myLongitude = document.querySelector("#myLong");

const btn = document.querySelector("#shareLoc");
btn.addEventListener("click", function () {
    socket.emit('sendLoc', myLongitude.innerHTML, myLatitude.innerHTML);
    // console.log(myLatitude.innerHTML);
})
// socket.emit('send', message);
