const { Client: ClientWp, LocalAuth } = require('whatsapp-web.js');
const { Client: ClientPg } = require('pg');
// const qrcode = require('qrcode-terminal');
const dotenv = require('dotenv');
const moment = require('moment');
dotenv.config();

const clientPg = new ClientPg();
clientPg.connect();

const clientWp = new ClientWp({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: false }
});

clientWp.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    // qrcode.generate(qr, {small: true});
});

clientWp.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

clientWp.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
});

clientWp.on('ready', () => {
    console.log('Client is ready!');
});

clientWp.on('message', async (msg) => {
    let chat;
    switch (msg.body) {
        case '!ping':
            chat = await msg.getChat();
            if (chat.isGroup) {
                chat.sendMessage('pong');
            }
            break;
        case '!lista':
            chat = await msg.getChat();
            if (chat.isGroup) {
                chat.sendMessage('Ola, por gentileza, selecione uma opcao a seguir:');
                chat.sendMessage('!w1: Tamanho da fila de pendencias.\n!w2: Pendencia mais antiga.\n!w3: Estabilidade do servico.');
            }
            break;
        case '!w1':
            chat = await msg.getChat();
            if (chat.isGroup) {
                clientPg
                    .query('select * from public.tb_vendafila tv order by tv.sent')
                    .then(res => {
                        chat.sendMessage(`Quantidade de itens na fila: ${res.rowCount}`);
                        console.log(`Quantidade de itens na fila: ${res.rowCount}`);
                    })
                    .catch(e => console.log(e.stack));
            }
            break;
        case '!w2':
            chat = await msg.getChat();
            if (chat.isGroup) {
                clientPg
                    .query('select * from public.tb_vendafila tv order by tv.sent')
                    .then(res => {
                        if (res.rowCount > 0) {
                            const { sent, seqmarketplace } = res.rows[0];
                            if (seqmarketplace != 17) {
                                chat.sendMessage(`Pendencia mais antiga foi recebida em: ${moment(sent).format('DD/MM/YYYY HH:mm:ss')}`);
                                console.log(`Pendencia mais antiga foi recebida em: ${moment(sent).format('DD/MM/YYYY HH:mm:ss')}`);
                            } else {
                                chat.sendMessage(`Pendencia mais antiga foi recebida em: ${moment(sent).add(3, 'hours').format('DD/MM/YYYY HH:mm:ss')}`);
                                console.log(`Pendencia mais antiga foi recebida em: ${moment(sent).add(3, 'hours').format('DD/MM/YYYY HH:mm:ss')}`);
                            }
                        } else {
                            chat.sendMessage('A fila está vazia!');
                        }
                    })
                    .catch(e => console.log(e.stack));
            }
            break;
    }
});

clientWp.on('message_create', async (msg) => {
    let chat;
    if (msg.fromMe) {
        if (msg.body === '!testeBot') {
            console.log(msg.body);
            chat = await msg.getChat();
            if (chat.isGroup) {
                console.log(chat.id);
                console.log(chat.name);
                chat.sendMessage('Oi');
            }
        }
    }
});

clientWp.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
});

clientWp.initialize();