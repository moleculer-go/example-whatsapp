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
  MDBListGroup,
  MDBListGroupItem,
  MDBBtn,
  MDBInput
} from "mdbreact";
import withAuth from "../lib/withAuth";
import { postRequest } from "../lib/request";

class Messages extends React.Component {
  static async getInitialProps(ctx) {
    const target = ctx.query.target;
    let messages = [];
    return { messages, target };
  }

  async sendMessage(message) {
    const { deviceToken, target } = this.props;
    this.setState({ ...this.state, loading: true });
    const result = await postRequest("/api/chat/sendMessage", {
      deviceToken,
      message,
      target
    });
    this.setState({ ...this.state, message: "", loading: false });
    console.log("sendMessage() result: ", result);
  }

  renderMessages() {
    const { messages } = this.props;
    if (!messages || !messages.map || messages.length == 0) {
      return <div>No messages found :( </div>;
    }
    return messages.map(item => {
      return (
        <MDBListGroupItem key={item.id}>
          <div className="d-flex w-100 justify-content-between">
            {item.content}
          </div>
          <hr />
        </MDBListGroupItem>
      );
    });
  }

  renderButtons() {
    const { loading } = this.state;
    if (loading) {
      return <div>Sending... </div>;
    }
    return (
      <MDBBtn onClick={e => this.sendMessage(this.state.message)}>
        Send Message
      </MDBBtn>
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
            <MDBCardTitle>Messages</MDBCardTitle>
            <MDBContainer>
              <MDBListGroup style={{ width: "22rem" }}>
                {this.renderMessages()}
              </MDBListGroup>
            </MDBContainer>
            <hr />
            <div className="d-flex w-100 justify-content-between">
              <h5>New Message</h5>
              <small>
                <b>target:</b> {this.props.target}
              </small>
            </div>
            <div className="grey-text">
              <MDBInput
                label="Message"
                icon="message"
                group
                type="text"
                validate
                error="wrong"
                success="right"
                value={this.state.message}
                onChange={e =>
                  this.setState({ ...this.state, message: e.target.value })
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

export default withAuth(Messages);
