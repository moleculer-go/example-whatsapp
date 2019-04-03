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
import withAuth from "../lib/withAuth";
class Contacts extends React.Component {
  static async getInitialProps(ctx) {
    let contacts = {};
    if (ctx.session) {
      contacts = await (await fetch(
        `http://localhost:3100/api/contacts/find?deviceToken=${ctx.deviceToken}`
      )).json();
      console.log(
        "contacts -> ",
        contacts,
        " ctx.deviceToken: ",
        ctx.deviceToken
      );
    }
    return { contacts };
  }

  renderContacts() {
    const { contacts } = this.props;
    if (!contacts || !contacts.map) {
      return <div>No contacts found :( </div>;
    }
    return contacts.map(item => {
      return (
        <div>
          Name: {item.name}
          <br />
          Number: {item.number}
        </div>
      );
    });
  }

  render() {
    return (
      <MDBContainer>
        <MDBCard
          className="card-body"
          style={{ width: "33rem", marginTop: "1rem" }}
        >
          <MDBCardBody>
            <MDBCardTitle>Contacts</MDBCardTitle>
            {this.renderContacts()}
            <Link href="/newContact">
              <MDBBtn>New Contact</MDBBtn>
            </Link>
          </MDBCardBody>
        </MDBCard>
      </MDBContainer>
    );
  }
}

export default withAuth(Contacts);
