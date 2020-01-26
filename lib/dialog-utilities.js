const {TextEditor, CompositeDisposable, Disposable} = require('atom');
const dialog = require('electron').remote.dialog;

module.exports = {
  newLabel(parent, text, style, custom) {
    var label = document.createElement(style);
      label.textContent = text;
      if (style == 'h2') {
        label.style.paddingBottom = '0px';
        label.style.marginBottom = '2px';
      }
      if (custom) {
        label.style.padding = '0px';
        label.style.marginTop = '2px';
      }
      parent.appendChild(label);
  },

  newString(parent, disposables, text, tabIndex, readOnly) {
    var edit = new TextEditor({mini: true, readOnly: readOnly});
      disposables.add(new Disposable(() => edit.destroy()));
      edit.element.tabIndex = tabIndex;
      if (text) edit.setText(text, {bypassReadOnly: true});
      parent.appendChild(edit.element);
    return edit;
  },

  newEditor(parent, disposables, text, tabIndex, readOnly, grammar) {
    var edit = new TextEditor({autoHeight: false, mini: false, readOnly: readOnly});
      //disposables.add(new Disposable(() => edit.dispose()));
      edit.element.tabIndex = tabIndex;
      edit.element.style.height = "200px";
      edit.setGrammar(atom.grammars.grammarForScopeName(grammar));
      //edit.setGrammar("source c");
      if (text) edit.setText(text, {bypassReadOnly: true});
      parent.appendChild(edit.element);
    return edit;
  },

  newFileSelector(parent, disposables, text, tabIndex, readOnly, type) {
    var edit = this.newString(parent, disposables, text, tabIndex, readOnly);
      if (readOnly) edit.element.tabIndex = 0;
      else tabIndex++;
      edit.element.style.flex = '100';

    var button = document.createElement('button');
      button.type = 'button';
      button.style.display = 'inline';
      button.style.color = 'grey';
      button.style.fontSize = 'small';
      button.style.height = '29px';
      button.style.width = '32px';
      button.classList.add('icon');
      button.classList.add('icon-search');
      button.tabIndex = tabIndex;
      button.addEventListener('click', () => {
        dialog.showOpenDialog({defaultPath: edit.getText(), properties:[type]}, (fileNames) => {
          if (fileNames === undefined) return;
          edit.setText(fileNames[0], {bypassReadOnly: true});
        });
        edit.element.focus();
      });

      var div = document.createElement('div');
        div.style.display = 'flex';
        div.appendChild(edit.element);
        div.appendChild(button);
      parent.appendChild(div);

      return edit;
  },

  newSelector(parent, text, options, tabIndex) {
    var fragment = document.createDocumentFragment();
      var label = document.createElement('label');
        label.classList.add('control-label');

      var div = document.createElement('div');
        div.classList.add('setting-title');
        div.textContent = text;
        label.appendChild(div);

      fragment.appendChild(label)

      var select = document.createElement('select');
        select.tabIndex = tabIndex;
        select.classList.add('form-control');
        for (var i = 0; i < options.length; i++)
        {
          var optionElement = document.createElement('option');
            optionElement.value = options[i];
            optionElement.textContent = options[i];
            select.appendChild(optionElement);
        }
      fragment.appendChild(select);
    parent.appendChild(fragment);

    return select;
  },

  newCheckBox(parent, text, disabled, checked, tabIndex) {
    var div = document.createElement('div');
      div.classList.add('checkbox');
      var label = document.createElement('label');
        var checkBox = document.createElement('input');
        checkBox.type = 'checkbox';
        checkBox.checked = checked;
        checkBox.disabled = disabled;
        checkBox.classList.add('input-checkbox');
        checkBox.tabIndex = tabIndex;
      label.appendChild(checkBox);
        var title = document.createElement('div');
        title.classList.add('setting-title');
        if (disabled) title.style.color = 'DimGrey';
        title.textContent = text;
        label.appendChild(title);
      div.appendChild(label);
    parent.appendChild(div);

    return checkBox;
  },

  newButton(parent, text, disabled, tabIndex) {
    var button = document.createElement('button');
      button.style.color = 'DimGrey';
      button.textContent = text;
      button.disabled = disabled;
      button.tabIndex = tabIndex;
    parent.appendChild(button);

    return button;
  }
}
