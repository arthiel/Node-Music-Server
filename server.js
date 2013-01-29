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
    else if(request.url == '/chat' ){
        fs.readFile( __dirname + '/chat.html', 
            function( err, data ){
                if( err ){
                    response.writeHead( 500 );
                    return response.end( 'Error loading chat.html' );
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

    // Change room status
    socket.on( 'roomStatusChange', function( stat ){
        socket.room.playStatus = stat;
        socket.broadcast.to( 'main' ).emit( 'updatePlayingNow', {rm: socket.room, playStatus: stat} );
        console.log( socket.room + " status changed: " + stat );
    });

    // On disconnection from server.
    socket.on( 'disconnect', function() {
        delete users[socket.username];
        socket.broadcast.emit( 'updateMsg', 'SERVER', {msg: socket.username + ' has left the room.'} );
        socket.leave( socket.room );
    });

});
