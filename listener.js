const admin = require("firebase-admin");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { print } = require("pdf-to-printer");


// FIREBASE

const serviceAccount = require("C:/Users/CAJA/Downloads/asian-sushi-7095b-firebase-adminsdk-fbsvc-a49c42dc7b");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

console.log("🔥 Buscando pedidos...");


// CONTROLAR DUPLICADOS

const pedidosProcesados = new Set();


// BUSCAR CADA 5 SEGUNDOS

setInterval(async () => {

  try {

    const snapshot = await db.collection("pedidos").get();

    snapshot.forEach(async (docSnap) => {

      const id = docSnap.id;

      // SI YA FUE IMPRESO

      if (pedidosProcesados.has(id)) {
        return;
      }

      pedidosProcesados.add(id);

      const pedido = docSnap.data();

      console.log("🛒 NUEVO PEDIDO");

      try {

        const pdfPath = path.join(__dirname, "ticket.pdf");

        const docPdf = new PDFDocument({
          size: [220, 500],
          margin: 10
        });

        const stream = fs.createWriteStream(pdfPath);

        docPdf.pipe(stream);


        // TITULO

        docPdf
          .fontSize(18)
          .text("ASIAN SUSHI", {
            align: "center"
          });

        docPdf.moveDown();


        // CLIENTE

        docPdf.fontSize(12);

        docPdf.text("Cliente: " + pedido.cliente);
        docPdf.text("Telefono: " + pedido.telefono);
        docPdf.text("Direccion: " + pedido.direccion);
        docPdf.text("Detalle:");
        docPdf.text(pedido.direccionTexto);

        docPdf.moveDown();


        // PRODUCTOS

        docPdf.text("PRODUCTOS:");

        pedido.productos.forEach((item) => {

          docPdf.moveDown(0.5);

          docPdf.text(item.nombre);

          docPdf.text("$" + item.precio);

        });


        // EXTRAS

        docPdf.moveDown();

        docPdf.text("Palitos: " + pedido.palitos);
        docPdf.text("Salsas: " + pedido.salsas);

        docPdf.moveDown();


        // TOTAL

        docPdf.text("Delivery: $" + pedido.delivery);
        docPdf.text("Subtotal: $" + pedido.subtotal);

        docPdf.moveDown();

        docPdf
          .fontSize(16)
          .text("TOTAL: $" + pedido.total);


        // FECHA

        docPdf.moveDown();

        docPdf.fontSize(10);

        docPdf.text(pedido.fecha);


        // FINALIZAR PDF

        docPdf.end();


        // ESPERAR

        await new Promise((resolve) => {
          stream.on("finish", resolve);
        });

        console.log("PDF CREADO");


        // IMPRIMIR

        await print(pdfPath);

        console.log("✅ IMPRESIÓN EXITOSA");

      } catch (err) {

        console.log("❌ ERROR IMPRIMIENDO");
        console.log(err);

      }

    });

  } catch (error) {

    console.log("❌ ERROR FIREBASE");
    console.log(error);

  }

}, 5000);