import React from 'react'
import { Segment, Button, Input } from 'semantic-ui-react'
import firebase from '../../firebase'
import FileModal from './FileModal'
import uuiv4 from 'uuidv4'
class MessageForm extends React.Component {

    state = {
        storeRef: firebase.storage().ref(),
        uploadState: '',
        uploadTask: null,
        percentUploaded: 0,
        message: '',
        loading: false,
        channel: this.props.currentChannel,
        user: this.props.currentUser,
        errors: [],
        modal: false,

    }

    handleChange = event => {
        this.setState({ [event.target.name]: event.target.value });
        console.log(event.target.keyCode)
    }



    createMessage = (fileURL = null) => {
        const message = {
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            content: this.state.message,
            user: {
                id: this.state.user.uid,
                name: this.state.user.displayName,
                avatar: this.state.user.photoURL
            }

        };
        if (fileURL !== null) {
            message['image'] = fileURL;
        } else {
            message['content'] = this.state.message;
        }
        return message;
    };

    sendMessage = () => {
        const { getMessagesRef } = this.props;
        const { message, channel } = this.state;

        if (message) {
            this.setState({ loading: true });
            getMessagesRef()
                .child(channel.id)
                .push()
                .set(this.createMessage())
                .then(() => {
                    this.setState({ loading: false, message: '', errors: [] })

                })
                .catch(err => {
                    console.log(err);
                    this.setState({
                        loading: false,
                        errors: this.state.errors.concat(err)
                    })
                })
        } else {
            this.setState({
                errors: this.state.errors.concat({ message: 'Add a message' })
            });
        }

    }

    openModal = () => {
        this.setState({ modal: true });
    }

    closeModal = () => {
        this.setState({ modal: false });
    }

    getPath = () => {
        if (this.props.isPrivateChannel) {
            return 'chat/private-' + this.state.channel.id;
        } else {
            return 'chat/public'
        }
    }

    uploadFile = (file, metadata) => {
        const pathToUpload = this.state.channel.id;
        const ref = this.props.getMessagesRef();
        const filePath = this.getPath() + '/' + uuiv4() + '.jpg'
        console.log(metadata)

        this.setState({
            uploadState: 'uploading',
            uploadTask: this.state.storeRef.child(filePath).put(file, metadata)
        },
            () => {
                this.state.uploadTask.on('state_changed', snap => {
                    const percentUploaded = Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
                    this.setState({ percentUploaded });
                    this.state.uploadTask.snapshot.ref.getDownloadURL().then(downloadURL => {
                        this.sendFileMessage(downloadURL, ref, pathToUpload);

                    }).catch(err => {

                        this.setState({ errors: this.state.errors.concat(err) })
                    })
                })
            },
            err => {

                this.setState({
                    errors: this.state.errors.concat(err),
                    uploadState: 'error',
                    uploadTask: null
                })
            }

        )
    }



    sendFileMessage = (fileURL, ref, pathToUpload) => {
        ref.child(pathToUpload)
            .push()
            .set(this.createMessage(fileURL))
            .then(this.setState({ uploadState: 'done' }))
            .catch(err => {
                console.log(err);
                this.setState({ errors: this.state.errors.concat(err) })
            })

    }


    chatKeyPress = (event) => {
        ///
        ///if press enter then send message
        ///
        console.log(event.type)
        if (event.keyCode == 13)
            this.sendMessage()
    } 


    render() {
        const myStyle = {
            inputChatForm: {
                marginTop: 50
            }
        }
        const { errors, message, loading, modal } = this.state;
        return (
            <Segment vertical='center' textAlign='center' style={myStyle.inputChatForm} className="message__form">
                

                <Input size='big'
                    onKeyDown={this.chatKeyPress}
                    fluid
                    focus
                    name="message"
                    onChange={this.handleChange}
                    label={<Button icon={"picture"} onClick={this.openModal} />}
                    labelPosition="left"
                    placeholder="Nhập tin nhắn"
                    className={
                        errors.some(error => error.message.includes('message')) ? "error" : ""
                    }
                    value={message}
                    icon='send' />
                <br></br>

                <FileModal
                    modal={modal}
                    closeModal={this.closeModal}
                    uploadFile={this.uploadFile}
                />

            </Segment>
        );
    }
}

export default MessageForm;