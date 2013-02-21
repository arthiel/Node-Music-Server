// Music Maipulation Server with Socket.io
// Server-Side
// server.js
// Author: Emily Egeland


// Define Server
var serv = require( 'http' ).createServer( handler ),
    io = require( 'socket.io' ).listen( serv ),
    fs = require( 'fs' );

    serv.listen( 8080 );

// Define existing rooms
var rooms = ['chat', 'music', 'main'];
// List of users
var users = {};

// Routing the page requests
function handler( request, response ){
    // Request the Index
    if( request.url == '/' || request.url == '/index' ){
        fs.readFile( __dirname + '/index.html', 
            function( err, data ){
                if( err ){
                    response.writeHead( 500 );
                    return response.end( 'Error loading index.html' );
                }

                // Write page to client
                response.writeHead( 200 );
                response.end( data );
            });
    }
    else if(request.url == '/client_room.js' ){
        fs.readFile( __dirname + '/client_room.js', 
            function( err, data ){
                if( err ){
                    response.writeHead( 500 );
                    return response.end( 'Error loading client_room.js' );
                }

                // Write page to client
                response.writeHead( 200 );
                response.end( data );
            });
    }
    else if(request.url == '/style.css' ){
        fs.readFile( __dirname + '/style.css', 
            function( err, data ){
                if( err ){
                    response.writeHead( 500 );
                    return response.end( 'Error loading style.css' );
                }

                // Write page to client
                response.writeHead( 200 );
                response.end( data );
            });
    }
}

// For Connected Sockets
io.sockets.on( 'connection', function( socket ) {

    // When a user is added to the connection
    socket.on( 'addUser', function( username ){
        // Add user to the respective room(s)
        socket.username = username;
        socket.room = 'main';
        users[username] = username;
        socket.join( 'main' );
        // Broadcast to room that user has joined
        socket.broadcast.to( 'main' ).emit( 'updateMsg', 'SERVER', {msg: username + " has joined the room."} );
        for( var i = 0; i < rooms.length; i++ ){
            socket.emit( 'updateChatList' , {rm: rooms[i]} );
        }
    });

    // Receive chat from socket, send chat message back out
    socket.on( 'sendChat', function( data ) {
        io.sockets.in( socket.room ).emit( 'updateMsg', socket.username, {msg: data} );
    });

    // Create room
    socket.on( 'addRoom' , function( roomName ){
        rooms.push( roomName );
        //socket.join( roomName );
        socket.room.playStatus = "been created";
        socket.emit( 'updateChatList', { rm: roomName } );
    });

    // Change room
    socket.on( 'changeRoom', function( roomName ){
        // User should always be connected to the Main room.
        if( socket.room != 'main' ){
            socket.leave( socket.room );
        }

        // Control other room changes
        var rmTemp = socket.room;
        console.log( socket.username + " has left " + socket.room + " joining " + roomName ); 
        socket.room = roomName;
        socket.join( roomName );
        socket.emit( 'roomChanged', { rm: roomName, rmLeft: rmTemp, allRooms: io.sockets.manager.roomClients[socket.id] } );
    });

    // Change room status
    socket.on( 'roomStatusChange', function( stat ){
        socket.room.playStatus = stat;
        io.sockets.in('main').emit( 'updatePlayingNow', {rm: socket.room, playStatus: stat } );
        io.sockets.in( socket.room ).emit( 'roomStatus', { playStatus: stat } );
        console.log( socket.room + " status changed: " + stat );
    });

    // Play notes to other sockets/users in the room.
    socket.on( 'notePlayed', function( note ){
        io.sockets.in( socket.room ).emit( 'playedNote', socket.username, {played: note} );
    });

  /***** m e t r o n o m e *****/
    var stop = false;
    // Room is ready for metronome
    socket.on( 'soundReady', function() {
        console.log( "Client is ready for sound." );
        stop = false;
        var intId = setTimeout( startMeasure, 5000 );
        if (stop == true) {
            console.log("Cleared");
            clearInterval( intId );
        }
    });

    // room is to stop
    socket.on( 'stopBeat', function() {
        console.log("STOP");
        stop = true;
    });

    // start a new measure.
    function startMeasure(){
        socket.emit( 'newMeasure' );
        var intId = setTimeout( startMeasure, 5000 );
        if (stop == true) {
            console.log("Cleared");
            clearTimeout( intId );
        }
    }

    // On disconnection from server.
    socket.on( 'disconnect', function() {
        delete users[socket.username];
        socket.broadcast.emit( 'updateMsg', 'SERVER', {msg: socket.username + ' has left the room.'} );
        socket.leave( socket.room );
    });

});
