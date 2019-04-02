import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap-css-only/css/bootstrap.min.css";
import "mdbreact/dist/css/mdb.css";
import Head from "next/head";
import Link from "next/link";
import {
  MDBBtn,
  MDBContainer,
  MDBCard,
  MDBCardTitle,
  MDBCardText,
  MDBCardImage,
  MDBCardBody
} from "mdbreact";

function Home() {
  return (
    <div>
      <Head>
        <title>Whats App Example App - Moleculer Go</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>

      <MDBContainer>
        <MDBCard
          className="card-body"
          style={{ width: "22rem", marginTop: "1rem" }}
        >
          <MDBCardBody>
            <MDBCardTitle>Welcome to WhatsApp Example App !</MDBCardTitle>
            <MDBCardImage
              className="img-fluid"
              src="/static/imgs/gophers_group.png"
              waves
            />
            <div>
              <p className="lead">
                I'm built using{" "}
                <a href="http://gomicro.services">Moleculer Go</a>
                :)
              </p>
              <hr className="my-2" />
              <p>I automate common tasks on whatsapp :)</p>
              <hr className="my-2" />

              <p className="small">
                Disclaimer: <b>Legal</b> <br />
                This code is in no way affiliated with, authorized, maintained,
                sponsored or endorsed by WhatsApp or any of its affiliates or
                subsidiaries. This is an independent and unofficial software.
                Use at your own risk.
              </p>
            </div>
            <div className="flex-row">
              <Link href="/generateCode">
                <MDBBtn>Login</MDBBtn>
              </Link>
            </div>
          </MDBCardBody>
        </MDBCard>
      </MDBContainer>
    </div>
  );
}
export default Home;
