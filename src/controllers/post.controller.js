import { Post } from "../models/post.model.js";

// Create a post
const createPost = async (req, res) => {
    try {
        const{name, description, age} = req.body;

        if(!name || !description || !age)
            {
            return res.status (400).json({
                message:"All fields are required."
            });
        }
            const post = await Post.create ({ name, description, age });
            
            res.status(201).json ({ 
                message: "Post created successfully", post 
            });

            

    } 
    
    catch (error) {
        res.status(500).json({
            message:"Internal Server Error", error 
        });
    }
    
}

// Read all posts
const getPosts = async (req, res) => {
    try {
        const posts = await Post.find();
        res.status(200).json (posts);

    } catch (error) {
         res.status(500).json({
            message:"Internal Server Error", error
        });
    }
}

// Update a post
const updatePosts = async (req, res) => {
    try {
        //basic validation to check if body is empty
        if(Object.keys(req.body).length == 0){
             return res.status(400).json ({
                message:"No data provided for update."
             });

        }

        const post = await Post.findByIdAndUpdate(req.params.id, req.body);

            if(!post) return res.status(404).json({
                message:"Post Not Found"
            });
            res.status(200).json({
                message:"Post Updated Successfully.", post
            });
            

    }
     catch (error) {
         res.status(500).json({
            message:"Internal Server Error", error
        });
    }
}

//
const deletePost = async (req, res) => {
    try {
        const deleted = await Post.findByIdAndDelete(req.params.id);
        if(!deleted) return res.status(404).json({
            message:"Post Not Found"
        });

        res.status(200).json({
            message:"Post Successfully Deleted"
        })

    } 
    
    catch (error) {
        res.status(500).json({
            message:"Internal Server Error", error
        });
    }
}

export {
    createPost,
    getPosts,
    updatePosts,
    deletePost
};
