/* global Handlebars */
(function() {

  var padNumber = function(num) {
    if (num < 10) {
      return '0' + num;
    }
    return num;
  };

  // Insert new helpers here
  var helpersDict = {
    /**
     * Analytics link
     */
    'taggedAnchor': function(url, text) {
      return '<a href="' + url + '">' + text + '</a>';
    },
    'ifIsObject': function(item, options) {
      if (typeof item === 'object') {
        return options.fn(this);
      }
      return options.inverse(this);
    },
    'stringify': function(obj) {
      return JSON.stringify(obj);
    },
    'typeof': function(obj) {
      return typeof obj.valueOf();
    },
    'or': function(a, b) {
      return a || b;
    },
    'formatDate': function(date) {
      var
        date = new Date(date),
        d = padNumber(date.getDate()),
        m = padNumber(date.getMonth() + 1),
        y = date.getFullYear(),
        hh = padNumber(date.getHours()),
        mm = padNumber(date.getMinutes()),
        ss = padNumber(date.getSeconds());
      return '[' + [d, m, y].join('-') + ' ' + [hh, mm, ss].join(':') + ']';
    }
  };

  // Do not touch
  try {
    module.exports = helpersDict;
  } catch(e) {
    for (var k in helpersDict) {
      if (helpersDict.hasOwnProperty(k)) {
        Handlebars.registerHelper(k, helpersDict[k]);
      }
    }
  }

})();



