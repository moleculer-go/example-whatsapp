import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap-css-only/css/bootstrap.min.css";
import "mdbreact/dist/css/mdb.css";
import "isomorphic-unfetch";
import React from "react";
import Link from "next/link";
import {
  MDBCard,
  MDBContainer,
  MDBCardBody,
  MDBCardTitle,
  MDBCardImage,
  MDBBtn
} from "mdbreact";
import QRCode from "qrcode.react";
import withAuth from "../lib/withAuth";
class GenerateCode extends React.Component {
  static async getInitialProps(ctx) {
    if (ctx.session) {
      return {};
    }

    const res = await fetch(
      `http://localhost:3100/api/login/newSession?token=${ctx.deviceToken}`,
      { mode: "cors" }
    );
    const { code, clientToken } = await res.json();
    return { code, clientToken };
  }

  renderCode() {
    if (this.props.code) {
      return (
        <div>
          <QRCode size={450} level="M" value={this.props.code} />
        </div>
      );
    } else {
      return (
        <MDBContainer>
          Already Logged In ..
          <Link href="/contacts">
            <MDBBtn>Move on...</MDBBtn>
          </Link>
        </MDBContainer>
      );
    }
    return <p>Loading ...</p>;
  }

  render() {
    return (
      <MDBContainer>
        <MDBCard
          className="card-body"
          style={{ width: "33rem", marginTop: "1rem" }}
        >
          <MDBCardBody>
            {this.renderCode()}
            <MDBCardTitle className="center">Scan on your Phone</MDBCardTitle>
          </MDBCardBody>
        </MDBCard>
      </MDBContainer>
    );
  }
}

export default withAuth(GenerateCode, { loginRequired: false });
