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
import withAuth from "../lib/withAuth";
import { postRequest } from "../lib/request";
class NewContact extends React.Component {
  async saveContact(data) {
    console.log("saving contact... data: ", data);
    console.log("props ", this.props);
    const { deviceToken } = this.props;
    const { id, name, mobile } = data;
    const contact = { id, name, mobile, deviceToken };
    const result = await postRequest("/api/contacts/create", contact);
    console.log("result: ", result);
    this.setState({ ...this.state, ...result, saved: true });
  }

  renderMsgs() {
    if (this.state.saved) {
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

  renderButtons() {
    if (this.state.saved) {
      return (
        <Link href="/contacts">
          <MDBBtn>Back</MDBBtn>
        </Link>
      );
    }
    return (
      <MDBBtn onClick={e => this.saveContact(this.state)}>Save Contact</MDBBtn>
    );
  }

  render() {
    this.state = this.state || {};
    return (
      <MDBContainer>
        <MDBCard
          className="card-body"
          style={{ width: "33rem", marginTop: "1rem" }}
        >
          <MDBCardBody>
            <MDBCardTitle>New Contact</MDBCardTitle>
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
                value={this.state.name}
                onChange={e =>
                  this.setState({ ...this.state, name: e.target.value })
                }
              />
              <MDBInput
                label="Mobile"
                icon="mobile"
                group
                type="text"
                validate
                error="wrong"
                success="right"
                value={this.state.mobile}
                onChange={e =>
                  this.setState({ ...this.state, mobile: e.target.value })
                }
              />
            </div>
            {this.renderButtons()}
          </MDBCardBody>
        </MDBCard>
      </MDBContainer>
    );
  }
}

export default withAuth(NewContact);
