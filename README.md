Sentinella
===================

[![Build Status](https://travis-ci.org/Meesayen/sentinella.svg?branch=master)](https://travis-ci.org/Meesayen/sentinella) [![dependency Status](https://david-dm.org/meesayen/sentinella/status.svg?style=flat)](https://david-dm.org/meesayen/sentinella) [![devDependency Status](https://david-dm.org/meesayen/sentinella/dev-status.svg?style=flat)](https://david-dm.org/meesayen/sentinella#info=devDependencies)


Sentinella is just a simple remote asynchronous logging system, complete with a web console service written on top of node.js, and a logger module that works with every browsers anywhere (may not be true! :3)

I started developing Sentinella to remotely debug my applications on devices like the Samsung SmartTV, where you cannot rely entirely on the emulator to fix some obscure bugs.

Dependencies
-------

The app needs a [mongodb][mongodb] instance to store the users, apps and log messages.

Documentation
-------------

TODO

Web Console Usage
-----

The Sentinella web console runs on the port 1337, you just need to download the code, and run:

    npm install

to install dependecies, and then:

    node app.js

to launch the web server. Then you can reach it at [http://localhost:1337][localhost]

Logger Module Usage
----

To use the logger module you can import it like a normal javascript library or use it as a requirejs module.
It uses the singleton pattern to give you the same instance everytime you attempt to create a new logger with the same appName.

The logger configuration is very simple. When you create an instance of it you pass it an appName and a set of options, both optional. Example:

    var log = new Logger('awesome-app', {
      user: 'the-coolest',                 // optional
      url: 'http://84.10.147.29:1337',     // optional too
      forceXhr: true                       // optional everything
    });

By default both `appName` and `user` are set to `'global'`, the `url` is set to `'http://localhost:1337'` and the `forceXhr` parameter is set to `false`.
The latter is used to force the logger to send messages to the server when you run the app on Chrome,  where the default behavior is to print on the web inspector console.

You can also set multiple users with the method `addUser(username)`, example:

    var log = new Logger();             // default user 'global'
    log.log('Hello, World...');         // this log will be shown on the 'global' user stream
    log.addUser('raziel');
    log.raziel.log('Hello, Nosgoth!');  // this log will only be shown on the 'raziel' user stream

You can set log levels for each message using the appropriate methods:

    log.log();  // log level INFO
    log.warn(); // log level WARNING
    log.err();  // log level ERROR



[mongodb]: http://docs.mongodb.org/manual/
[localhost]: http://localhost:1337
