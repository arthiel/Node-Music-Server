// Client-Side "Room" Functions
// Emily Egeland
// 

// Add Room of Chats.
function addRoom() {
    socket.emit( 'addRoom', document.getElementById( 'roomName' ).value );
    console.log( "Add Room Done." );
}

// Change Room.
function changeRm(e){
    console.log( e.target.innerText );
    socket.emit( 'changeRoom', e.target.innerText );
}

// Change the status of the room
function radioChange( value ){
    if( room_status != value ){
        room_status = value;
        socket.emit( 'roomStatusChange', value );
    }
}
