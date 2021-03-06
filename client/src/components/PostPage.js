import React from 'react'
import {useState, useEffect} from 'react';
import {useParams} from 'react-router-dom';
import Comment from './Comment';
import {useNavigate} from 'react-router-dom';
//source on how to use toasts: https://fkhadra.github.io/react-toastify/introduction
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';

// Page for clicked post with comments
function PostPage() {
    //used to navigate to different url
    const navigate = useNavigate();
    // https://dev.to/alibahaari/how-to-re-fetch-data-when-something-changes-in-reactjs-375m
    // toggle used to inform page to re-fetch data when new comment is added.
    const [newCommentToggle, setNewCommentToggle] = useState(false);
    //logged in status boolean
    let loggedIn = false;
    if(localStorage.getItem('token')) {
        loggedIn = true;
    }

    //get postid from params
    const {postid} = useParams()
    
    //comment that is POST to /api/addcomment
    const [comment, setComment] = useState([{
        "username": null,
        "userid": null,
        "postid":  null,
        "lastedited": null,
        "text": null
      }]);

    //Fetched comments from /api/comments for current post
    const [comments, setComments] = useState([{
        "_id": null,
        "username": null,
        "userid": null,
        "postid": null,
        "lastedited": null,
        "text": null
      }]);

    //Clicked post
    const [post, setPost] = useState([{
        "_id": null,
        "username": null,
        "userid": null,
        "lastedited": null,
        "title": null,
        "text": null,
        "comments": null
      }]);
    
    //Fetches post from /api/post/:id
    useEffect(() => {
        //if postid is shorter than required 24
        if(postid.length !== 24) {
            navigate('/404')
        } else {
            let mounted = true;
            async function fetchPost() {
                let url = "/api/post/" + postid;
                let response = await fetch(url);
                let dataJson = await response.json();
                if(dataJson.success) {
                    if (mounted) {
                        setPost(dataJson.post);
                    }
                } else {
                    //if error loading post
                    mounted = false;
                    navigate('/404')  
                }
                
            }
            fetchPost();
            return () => {
                mounted = false;
            };
        }
    // eslint-disable-next-line
    }, [])
    //Fetches comments for current post
    //Rerenders comments when new comment is added
    useEffect(() => {
        let mounted = true;
        async function fetchComments() {
            let url = '/api/comment/' + postid;
            let response = await fetch(url);
            let dataJson = await response.json();
            if(dataJson.success) {
                if (mounted) {
                    setComments(dataJson.comments);
                }
            }
        }
        fetchComments();
        return () => {
            setNewCommentToggle(false);
            mounted = false;
        };
    // eslint-disable-next-line
    }, [newCommentToggle])

    //handles changes in new comment form
    const handleChange = (e) => {
        setComment({...comment, [e.target.name]: e.target.value})
    }

    //on submit adds post to data base with POST /api/addcomment
    //can only be done if authorized
    const submit = (e) => {
        e.preventDefault()
        comment.postid = postid
        fetch("/api/addcomment", {
            method: "POST",
            headers: {
                "Content-type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem('token')
            },
            body: JSON.stringify(comment),
            mode: "cors"
            })
            .then(response => response.json())
            .then(data => {
                console.log(data)
                if(data.success) {
                    setNewCommentToggle(true)
                } else {                
                    toast.error("Ran into an error.", {
                        position: "top-center",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }
                
            })
    }
    // Source for date parsing: https://www.tutorialguruji.com/react-js/why-do-i-get-rangeerror-date-value-is-not-finite-in-datetimeformat-format-when-using-intl-datetimeformat-in-react/
    // ToastContainer is part of toasts
    // react-bootstrap Card used to create UI
    //if username is clicked navigate to /user/userid
    return (
        <div className="m-3">
            <ToastContainer />
            <div >
                <Card border="primary">
                    <Card.Body>
                        <Card.Title>
                            {post.title}
                        </Card.Title>
                        <Card.Text>
                            {post.text}
                        </Card.Text>
                    </Card.Body>
                    <Card.Footer>
                    
                    <small onClick={() => navigate('/user/' + post.userid)}>By: {post.username}</small>
                    <br/>
                    {post.lastedited?.length > 0 && <small>Last edited: {new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeStyle: 'long' }).format(new Date(post.lastedited.toString()))}</small>}
                    </Card.Footer>
                </Card>
            </div>
            <div className="ms-5 me-5 mb-5 mt-3">
                <h2>Comments</h2>
                {comments?.length > 0 ? comments.map((comment) => (
                    <Comment key={comment._id} comment={comment}/>
                )) : "No comments."}
            </div>
            {loggedIn && <div>
                <Form onSubmit={submit} onChange={handleChange}>
                    <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
                        <Form.Label>Comment Text</Form.Label>
                        <Form.Control name="text" as="textarea" rows={3} required/>
                    </Form.Group>
                    <Button variant="dark" type="submit">
                        Submit Comment
                    </Button>
                </Form>
            </div>}
        </div>
        

    )
}

export default PostPage
