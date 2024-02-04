// server.test.js
import chai from 'chai';
import chaiHttp from 'chai-http';
import server from './server.js'; // Import your Express app
const { expect } = chai;

chai.use(chaiHttp);

describe('POST /samcoTestPlaceOrder', () => {
  it('should return status 200 and success message', (done) => {
    chai.request(server)
      .post('/samcoTestPlaceOrder?api_key=123')
      .send({ "abc": "def" })
      .end((err, res) => {
        if (err) done(err);
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body.data).to.equal('success');
        done();
      });
  });
});

// // describe('POST /add', () => {
// //   it('should add a user and return a success message', async () => {
// //     const res = await chai.request(server)
// //       .post('/add')
// //       .send({
// //         name: 'John Doe',
// //         email: 'john.doe@example.com',
// //         age: 30
// //       });

// //     expect(res.status).to.equal(200);
// //     expect(res.text).to.equal('Data added to Firebase');
// //   });
// // });

// // server.test.js
// describe('GET /get/:id', () => {
//   it('should get a user by id', (done) => {
//     chai.request(server)
//       .get('/get/user1') // Assuming 'user1' is the id of the user you added
//       .end((err, res) => {
//         console.log(res.body);
//         expect(res).to.have.status(200);
//         expect(res.body).to.be.an('object');
//         expect(res.body).to.have.property('name').equal('John Doe');
//         expect(res.body).to.have.property('email').equal('john.doe@example.com');
//         expect(res.body).to.have.property('age').equal(30);
//         done();
//       });``
//   });
// });

// describe('GET /get', () => {
//   it('should get data from Firebase', (done) => {
//     chai.request(server)
//       .get('/get')
//       .end((err, res) => {
//         expect(res).to.have.status(200);
//         // Add more assertions based on the expected structure of the data
//         done();
//       });
//   });

//   it('should return 404 if document does not exist', (done) => {
//     // Assuming you have a route that tries to get a non-existent document
//     chai.request(server)
//       .get('/get-non-existent')
//       .end((err, res) => {
//         expect(res).to.have.status(404);
//         done();
//       });
//   });
// });

// describe('GET /long', () => {
//   it('should return the long API response', (done) => {
//     chai.request(server)
//       .get('/long')
//       .end((err, res) => {
//         expect(res).to.have.status(200);
//         expect(res.body).to.have.property('message', 'This is the long API response.');
//         done();
//       });
//   });
// });