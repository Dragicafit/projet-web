$(() => {
    var socket = io.connect("http://localhost:3000/");

    socket.on('connect', () => {
        $('.texteMemo').keyup(function (e) {
            console.log('typing : ' + e);

            socket.emit('update', {
                memo: $(this).attr('id'),
                texte: $(this).val()
            });
        });

        $('.texteMemo').each(function () {
            socket.emit('new room', $(this).attr('id'));
        });

        socket.on('update others', (data) => {
            $('#' + data.memo).val(data.texte);
        });
    })
})