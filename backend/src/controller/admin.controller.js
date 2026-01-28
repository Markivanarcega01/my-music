import Song from "../models/song.model.js";
import Album from "../models/album.model.js";
import cloudinary from "../lib/cloudinary.js";

const uploadToCloudinary = async (file) => {
  try {
    const data = await cloudinary.uploader.upload(file.tempFilePath, {
      resource_type: "auto",
    });
    return data.secure_url;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to upload file to Cloudinary");
  }
};

export const createSong = async (req, res, next) => {
  try {
    if (!req.files || !req.files.audioFile || !req.files.imageFile) {
      return res
        .status(400)
        .json({ message: "Please upload audio and image file" });
    }

    const { title, artist, albumId, duration } = req.body;
    const audioFile = req.files.audioFile;
    const imageFile = req.files.imageFile;

    const audioUrl = await uploadToCloudinary(audioFile);
    const imageUrl = await uploadToCloudinary(imageFile);

    const song = new Song({
      title,
      artist,
      albumId: albumId || null,
      duration,
      audioUrl,
      imageUrl,
    });

    await song.save();

    //If song is added to album
    if (albumId) {
      await Album.findByIdAndUpdate(albumId, { $push: { songs: song._id } });
    }

    return res.status(201).json({ message: "Song created successfully", song });
  } catch (error) {
    console.log(error);
    // return res.status(500).json({ message: "Something went wrong" });
    next(error);
  }
};

export const deleteSong = async (req, res, next) => {
  try {
    const { id } = req.params;
    const song = await Song.findById(id);

    //if song belongs to an album, update the album's song array
    if (song.albumId) {
      await Album.findByIdAndUpdate(song.albumId, {
        $pull: { songs: song._id },
      });
    }

    await song.findByIdAndDelete(id);

    return res.status(200).json({ message: "Song deleted successfully" });
  } catch (error) {
    console.log("Error in deleting song", error);
    next(error);
  }
};

export const createAlbum = async (req, res, next) => {
  try {
    const { title, artist, releaseYear } = req.body;
    const { imageFile } = req.files;
    const imageUrl = await uploadToCloudinary(imageFile);

    const album = new Album({
      title,
      artist,
      releaseYear,
      imageUrl,
    });

    await album.save();
    return res
      .status(201)
      .json({ message: "Album created successfully", album });
  } catch (error) {
    console.log("Error in album creation", error);
    next(error);
  }
};

export const deleteAlbum = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Song.deleteMany({ albumId: id });
    await Album.findByIdAndDelete(id);
    res.status(200).json({ message: "Album deleted successfully" });
  } catch (error) {
    console.log("Error in deleting album", error);
    next(error);
  }
};

export const checkAdmin = async (req, res) => {
  res.status(200).json({ admin: true });
};
