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
  MDBBtn,
  MDBInput
} from "mdbreact";
import LoginPanel from "./login.panel";
import withAuth from "../lib/withAuth";

class NewContact extends React.Component {
  static async getInitialProps({ deviceToken }) {
    return { deviceToken };
  }

  async saveContact(e) {
    console.log("saving contact...");
    const { name, mobile, deviceToken } = this.props;
    const contact = { name, mobile, deviceToken };
    const res = await fetch("http://localhost:3100/api/contacts/create", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(contact)
    });
    const result = await res.json();
    console.log("result: ", result);
    this.setState({ ...this.state, saved: true });
  }

  renderMsgs() {
    if (this.state && this.state.saved) {
      return (
        <div>
          <hr />
          <b>Contact Saved!</b>
          <hr />
        </div>
      );
    }
    return <div />;
  }

  render() {
    return (
      <MDBContainer>
        <MDBCard
          className="card-body"
          style={{ width: "33rem", marginTop: "1rem" }}
        >
          <MDBCardBody>
            <MDBCardTitle>New Contacts</MDBCardTitle>
            {this.renderMsgs()}
            <div className="grey-text">
              <MDBInput
                label="Name"
                icon="user"
                group
                type="text"
                validate
                error="wrong"
                success="right"
                value={this.props.name}
              />
              <MDBInput
                label="Mobile"
                icon="mobile"
                group
                type="text"
                validate
                error="wrong"
                success="right"
                value={this.props.mobile}
              />
            </div>
            <MDBBtn onClick={e => this.saveContact(e)}>Save Contact</MDBBtn>
          </MDBCardBody>
        </MDBCard>
      </MDBContainer>
    );
  }
}

export default withAuth(NewContact);
