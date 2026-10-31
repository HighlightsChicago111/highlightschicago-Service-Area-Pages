// Menu set-up for the tabs that use a simple onOpen. Paste as its own file (Menu.gs); one copy per spreadsheet.
// Each tab's script defines its own uniquely named menu function and no onOpen, so pasting one never overwrites
// another. The "Service pages" tab is not listed: its script adds its menu from its own installable on-open trigger,
// and listing it here would show that menu twice.
function onOpen() {
  var menus = ['serviceAreaPagesMenu', 'brandServicePagesMenu']
  for (var i = 0; i < menus.length; i++) {
    var fn = globalThis[menus[i]]
    if (typeof fn === 'function') fn()
  }
}
