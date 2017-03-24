var fs = require('fs');
var path = require('path');

module.exports = {
  selector: '.source.c',
  disableForSelector: '.source.c .comment',
  completions: {},
  inclusionPriority: 0,
  suggestionPriority: 0,

  getSuggestions: function({editor, bufferPosition, scopeDescriptor, prefix, activatedManually}) {
    var caseSens = false;
    if(atom.config.get('language-amigaos-c.autoCompPrefs.caseSens') == "On") caseSens = true;

    if (this.getPredWord(editor, bufferPosition) == "struct") return(this.suggestStructs(prefix, caseSens));

    if (prefix.length < 3 || atom.config.get('language-amigaos-c.autoCompPrefs.autoComplete') == false) return([]);

    var suggestions = [];
    var suggestion;
    var item;

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
      if (item.type != "struct" && this.compareStrings(item.displayText, prefix, caseSens)) suggestions.push(suggestion);
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

  getPredWord: function(editor, bufferPosition) {
    if (bufferPosition.column == 0) return null;
    var wordStart = [bufferPosition.row,0];
    var wordEnd   = [bufferPosition.row,0];
    var currentStart;
    //Skip current word:
    for (var i = bufferPosition.column; true ; i--) {
      var ch = editor.getTextInBufferRange([[bufferPosition.row,i-1],[bufferPosition.row,i]]);
      if (i == 0) return null;
      if (ch.match(/\w/)) continue;
      else {
        currentStart = i;
        break;
      }
    }
    //Find predecessor end
    for (var i = currentStart; true; i--) {
      var ch = editor.getTextInBufferRange([[bufferPosition.row,i-1],[bufferPosition.row,i]]);
      if (i == 0) return null;
      if (!ch.match(/\w/)) continue;
      else {
        wordEnd[1] = i;
        break;
      }
    }
    //Find predecessor start
    for (var i = wordEnd[1]; true; i--) {
      var ch = editor.getTextInBufferRange([[bufferPosition.row,i-1],[bufferPosition.row,i]]);
      if (i == 0 || !ch.match(/\w/)) {
        wordStart[1] = i;
        break;
      }
    }

    //return predword
    return(editor.getTextInBufferRange([wordStart, wordEnd]));
  },

  suggestStructs: function(prefix, caseSens) {
    var suggestions = [];
    var suggestion;
    var item;
    for (var i = 0, len = this.completions.length; i < len; i++) {
      item = this.completions[i];
      suggestion = {
        "snippet": item.displayText,
        "displayText": item.displayText,
        "replacementPrefix": prefix,
        "type": item.type,
        "leftLabel": item.type,
        "description": item.description,
        "descriptionMoreURL": item.descriptionMoreURL
      };
      if (item.type == "struct" && this.compareStrings(item.displayText, prefix, caseSens)) suggestions.push(suggestion);
    }
    return(suggestions);
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
