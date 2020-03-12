define(['message-bus', 'toolbar', 'ui/ui' ], function(bus, toolbar, ui) {
  let button = document.createElement('button');
  button.id = 'miboton';
  button.className = 'blue_button';
  button.innerHTML = 'Documentación';
  button.addEventListener('click', function(ui) {
    //alert('Proximamente documentación del Portal');
    //bus.send('ui-show', dialogId);

	bus.send("show-info", [ "Documentos", 'static/loc/es/html/document.html']);

  });

    var dialogId = 'document_panel';

  //create dialog 
	ui.create('dialog', {
		id: dialogId,
		parent: document.body,
		title: 'Documentación',
		closeButton: true
	});

    //Create div content message
	var content = ui.create('div', {
		id: dialogId + '_content',
                html: '<p><strong>Documentaci&oacute;n:</strong></p><ul><li><a href="https://redd.unfccc.int/uploads/4849_1_plan_de_accion_nacional_de_bosques_y_cambio_climatico_-_argentina.pdf" target="_blank" rel="noopener"><strong>Plan de Acci&oacute;n Nacional de Bosques y Cambio Clim&aacute;tico</strong></a></li><li><a href="https://redd.unfccc.int/files/2019_submission_frel_argentina.pdf" target="_blank" rel="noopener"><strong>Nivel de Referencia de Emisiones Forestales de Argentina</strong></a>&nbsp;</li></ul>',
		parent: dialogId
	});



  
  toolbar.get(0).appendChild(button);
});