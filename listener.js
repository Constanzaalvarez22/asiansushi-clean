const admin = require("firebase-admin");

const PDFDocument = require("pdfkit");

const fs = require("fs");

const path = require("path");

const { print } = require("pdf-to-printer");


// FIREBASE

const serviceAccount = require("./asian-sushi-7095b-firebase-adminsdk-fbsvc-555667f28e.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

console.log("🔥 Escuchando pedidos...");


// ESCUCHAR PEDIDOS

db.collection("pedidos").onSnapshot((snapshot) => {

  snapshot.docChanges().forEach(async (change) => {

    console.log("TIPO:", change.type);

    if (change.type === "added") {

      console.log("🛒 NUEVO PEDIDO");

      const pedido = change.doc.data();

      console.log(pedido);

      try {

        const pdfPath = path.join(__dirname, "ticket.pdf");

        const doc = new PDFDocument({
          size: [220, 500],
          margin: 10
        });

        const stream = fs.createWriteStream(pdfPath);

        doc.pipe(stream);


        // TITULO

        doc
          .fontSize(18)
          .text("ASIAN SUSHI", {
            align: "center"
          });

        doc.moveDown();


        // DATOS CLIENTE

        doc.fontSize(12);

        doc.text("Cliente: " + pedido.cliente);

        doc.text("Telefono: " + pedido.telefono);

        doc.text("Direccion: " + pedido.direccion);

        doc.text("Detalle direccion:");

        doc.text(pedido.direccionTexto);

        doc.moveDown();


        // PRODUCTOS

        doc.text("PRODUCTOS:");

        doc.moveDown(0.5);

        pedido.productos.forEach((item) => {

          doc.text(item.nombre);

          doc.text("$" + item.precio);

          doc.moveDown();

        });


        // EXTRAS

        doc.text("Palitos: " + pedido.palitos);

        doc.text("Salsas: " + pedido.salsas);

        doc.moveDown();


        // TOTALES

        doc.text("Delivery: $" + pedido.delivery);

        doc.text("Subtotal: $" + pedido.subtotal);

        doc.moveDown();

        doc
          .fontSize(16)
          .text("TOTAL: $" + pedido.total);


        // FECHA

        doc.moveDown();

        doc.fontSize(10);

        doc.text(pedido.fecha);


        // FINALIZAR PDF

        doc.end();


        // ESPERAR GUARDADO

        await new Promise((resolve) => {
          stream.on("finish", resolve);
        });

        console.log("PDF CREADO");


        // IMPRIMIR

        await print(pdfPath, {
          printer: "impresora CAJA"
        });

        console.log("✅ IMPRESIÓN EXITOSA");

      } catch (err) {

        console.error("ERROR:");
        console.error(err);

      }
    }
  });
});