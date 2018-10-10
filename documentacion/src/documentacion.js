define([ 'toolbar' ], function(toolbar) {
  let button = document.createElement('button');
  button.id = 'miboton';
  button.className = 'blue_button';
  button.innerHTML = 'Documentación';
  button.addEventListener('click', function() {
    alert('Proximamente documentación del Portal');
  });

  toolbar.get(0).appendChild(button);
});