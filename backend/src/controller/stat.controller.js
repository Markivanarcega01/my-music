import User from "../models/user.model.js";
import Song from "../models/song.model.js";
import Album from "../models/album.model.js";

export const getStats = async (req, res, next) => {
  try {
    // const totalSongs = await Song.countDocuments();
    // const totalAlbums = await Album.countDocuments();
    // const totalUsers = await User.countDocuments();

    const [totalSongs, totalAlbums, totalUsers, totalArtists] =
      await Promise.all([
        Song.countDocuments(),
        Album.countDocuments(),
        User.countDocuments(),
        Song.aggregate([
          {
            $unionWith: {
              coll: "album",
              pipeline: [],
            },
          },
          {
            $group: {
              _id: "$artist",
            },
          },
          {
            $count: "count",
          },
        ]),
      ]);

    return res.status(200).json({
      totalSongs,
      totalAlbums,
      totalUsers,
      totalArtists: totalArtists[0]?.count || 0,
    });
  } catch (error) {
    next(error);
  }
};
