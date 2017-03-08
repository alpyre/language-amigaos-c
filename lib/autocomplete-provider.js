var fs = require('fs');
var path = require('path');

module.exports = {
  selector: '.source.c',
  disableForSelector: '.source.c .comment',
  completions: {},
  inclusionPriority: 0,
  suggestionPriority: 0,

  getSuggestions: function({editor, bufferPosition, scopeDescriptor, prefix, activatedManually}) {
    if (prefix.length < 3 || atom.config.get('language-amigaos-c.autoCompPrefs.autoComplete') == false) return([]);
    var suggestions = [];
    var item;
    var suggestion;
    var caseSens = false;
    if(atom.config.get('language-amigaos-c.autoCompPrefs.caseSens') == "On") caseSens = true;

    //if the cursor is inside function scopes, coder is very probably typing arguments.
    //...so switch to caseSensitive mode not to annoy him/her with suggestions.
    if(atom.config.get('language-amigaos-c.autoCompPrefs.caseSens') == "Smart") {
      for (var i = 0; i < scopeDescriptor.scopes.length; i++) {
        if (scopeDescriptor.scopes[i] == 'meta.function.c' || scopeDescriptor.scopes[i] == 'meta.function-call.c'){
          caseSens = true;
          break;
        }
      }
      //...yet if the coder typed some specific patterns, switch to inCaseSensitive mode to provide suggestions.
      if (this.checkForPatterns(prefix.toLowerCase())) caseSens = false;
    }

    for (var i = 0, len = this.completions.length; i < len; i++) {
      item = this.completions[i];
      suggestion = {
        "snippet": item.snippet,
        "displayText": item.displayText,
        "replacementPrefix": prefix,
        "type": item.type,
        "leftLabel": item.leftLabel,
        "description": item.description,
        "descriptionMoreURL": item.descriptionMoreURL
      };
      if (this.compareStrings(item.displayText, prefix, caseSens)) suggestions.push(suggestion);
    }
    return(suggestions);
  },

  compareStrings: function(a, b, caseSens) {
    var maxLength = (a.length < b.length) ? a.length : b.length;
    if (!caseSens){
      a = a.toLowerCase();
      b = b.toLowerCase();
    }
    return(a.substring(0, maxLength) === b.substring(0, maxLength));
  },

  checkForPatterns: function(prefix) {
    var pattern = "(?:^ahi_)|(?:^mui(?:a|m|l)?)";
    if (prefix.match(pattern)) return(true);
    else return(false);
  },

  loadCompletions: function() {
    if (fs.existsSync(path.resolve(__dirname, '..', './completions/autoCompletions.JSON'))) {
      fs.readFile(path.resolve(__dirname, '..', './completions/autoCompletions.JSON'), (err, data) => {
        if(err) throw err;
        this.completions = JSON.parse(data);
      });
    }
  }
}
