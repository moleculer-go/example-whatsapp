import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap-css-only/css/bootstrap.min.css";
import "mdbreact/dist/css/mdb.css";
import "isomorphic-unfetch";
import React from "react";
import Link from "next/link";
import Router from "next/router";
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
import { getRequest, subscriber } from "../lib/request";

class GenerateCode extends React.Component {
  static async getInitialProps(ctx) {
    if (ctx.session) {
      return {};
    }
    const { code } = await getRequest(
      `/api/login/newSession?deviceToken=${ctx.deviceToken}`
    );
    return { code };
  }

  async componentDidMount() {
    const subscribe = subscriber("deviceToken", this.props.deviceToken);
    await subscribe("login.success", params => {
      console.log("login.success event params: ", params);
      Router.push("/contacts");
    });

    await subscribe("login.fail", params => {
      console.log("login.fail event params: ", params);
      this.setState({ ...this.state, loginState: "fail" });
    });
  }

  renderCode() {
    this.state = this.state || {};
    if (this.state.loginState === "fail") {
      return (
        <MDBContainer>
          Login falied. :(
          <br />
          The QR code might have timed out. Next time be ready to scan.
          <a onClick={() => window.location.reload(false)}>
            <MDBBtn>Try Again</MDBBtn>
          </a>
        </MDBContainer>
      );
    }
    return (
      <div>
        <QRCode size={450} level="M" value={this.props.code} />
        <hr />
        <MDBCardTitle className="center">Scan on your Phone</MDBCardTitle>
      </div>
    );
  }

  render() {
    return (
      <MDBContainer>
        <MDBCard
          className="card-body"
          style={{ width: "33rem", marginTop: "1rem" }}
        >
          <MDBCardBody>{this.renderCode()}</MDBCardBody>
        </MDBCard>
      </MDBContainer>
    );
  }
}

export default withAuth(GenerateCode, { loginRequired: false });
