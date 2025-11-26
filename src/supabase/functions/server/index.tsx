import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

// Supabase client
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
};

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-ba03ada2/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== AUTH ROUTES ====================

// Sign up
app.post("/make-server-ba03ada2/auth/signup", async (c) => {
  try {
    const { email, password, username } = await c.req.json();
    
    if (!email || !password || !username) {
      return c.json({ error: "Email, password, and username are required" }, 400);
    }

    const supabase = getSupabaseClient();
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email since we don't have email server configured
      user_metadata: { username }
    });

    if (authError) {
      console.error("Auth signup error:", authError);
      return c.json({ error: authError.message }, 400);
    }

    // Create user profile in our users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        username,
        email,
        avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face`
      })
      .select()
      .single();

    if (userError) {
      console.error("User profile creation error:", userError);
      return c.json({ error: "Failed to create user profile" }, 500);
    }

    return c.json({ 
      user: userData,
      message: "User created successfully"
    });
  } catch (error) {
    console.error("Signup error:", error);
    return c.json({ error: "Internal server error during signup" }, 500);
  }
});

// Get current user
app.get("/make-server-ba03ada2/auth/me", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const supabase = getSupabaseClient();
    
    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return c.json({ error: "Failed to fetch user profile" }, 500);
    }

    return c.json({ user: profile });
  } catch (error) {
    console.error("Get current user error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ==================== HABITS ROUTES ====================

// Get all habits for a user
app.get("/make-server-ba03ada2/habits", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get habits
    const { data: habits, error: habitsError } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (habitsError) {
      console.error("Habits fetch error:", habitsError);
      return c.json({ error: "Failed to fetch habits" }, 500);
    }

    return c.json({ habits });
  } catch (error) {
    console.error("Get habits error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Create a new habit
app.post("/make-server-5381f608/habits", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    console.log('🔍 DEBUG - Token recibido:', accessToken?.substring(0, 20) + '...');
    
    console.log('🔍 DEBUG - Token recibido:', accessToken?.substring(0, 20) + '...');
    
    if (!accessToken) {
      console.error('❌ No authorization token provided');
      console.error('❌ No authorization token provided');
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const supabase = getSupabaseClient();
    
    // 🔧 MODO DESARROLLO - Detectar token de desarrollo
    const DEV_MODE = accessToken.startsWith('dev-token-');
    let userId: string;
    
    if (DEV_MODE) {
      // Extraer user_id del token de desarrollo
      userId = accessToken.replace('dev-token-', '');
      console.log('🔧 MODO DESARROLLO ACTIVADO ACTIVADO - Usuario:', userId);
    } else {
      // Validación normal con JWT
      console.log('🔐 Modo producción - Validando JWT real');
      console.log('🔐 Modo producción - Validando JWT real');
      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      
      if (authError || !user) {
        console.error('❌ JWT validation failed:', authError);
        console.error('❌ JWT validation failed:', authError);
        return c.json({ error: "Invalid JWT", message: "Invalid JWT", message: "Unauthorized" }, 401);
      }
      
      userId = user.id;
    }

    const { title, description, category } = await c.req.json();

    if (!title) {
      return c.json({ error: "Title is required" }, 400);
    }

    // Usar 'name' en vez de 'title' y hacer category opcional
    const habitData: any = {
      user_id: userId,
      name: title, // La tabla usa 'name'
      description: description || ''
    };

    console.log('📝 Insertando hábito:', habitData);

    console.log('📝 Insertando hábito:', habitData);

    const { data: habit, error: habitError } = await supabase
      .from("habits")
      .insert([habitData])
      .select()
      .single();

    if (habitError) {
      console.error("❌ ❌ Habit creation error:", habitError);
      return c.json({ error: "Failed to create habit", details: habitError.message }, 500);
    }

    console.log('✅ Hábito creado exitosamente:', habit);
    console.log('✅ Hábito creado exitosamente:', habit);
    return c.json({ habit });
  } catch (error) {
    console.error("❌ ❌ Create habit error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update a habit
app.put("/make-server-ba03ada2/habits/:id", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const habitId = c.req.param("id");
    const { title, description, category } = await c.req.json();

    const { data: habit, error: habitError } = await supabase
      .from("habits")
      .update({
        title,
        description,
        category
      })
      .eq("id", habitId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (habitError) {
      console.error("Habit update error:", habitError);
      return c.json({ error: "Failed to update habit" }, 500);
    }

    return c.json({ habit });
  } catch (error) {
    console.error("Update habit error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Delete a habit
app.delete("/make-server-ba03ada2/habits/:id", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const habitId = c.req.param("id");

    const { error: deleteError } = await supabase
      .from("habits")
      .delete()
      .eq("id", habitId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Habit deletion error:", deleteError);
      return c.json({ error: "Failed to delete habit" }, 500);
    }

    return c.json({ message: "Habit deleted successfully" });
  } catch (error) {
    console.error("Delete habit error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ==================== HABIT COMPLETIONS ROUTES ====================

// Get habit completions for a date range
app.get("/make-server-ba03ada2/completions", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const startDate = c.req.query("start_date");
    const endDate = c.req.query("end_date");

    let query = supabase
      .from("habit_completions")
      .select("*")
      .eq("user_id", user.id);

    if (startDate) {
      query = query.gte("completion_date", startDate);
    }
    if (endDate) {
      query = query.lte("completion_date", endDate);
    }

    const { data: completions, error: completionsError } = await query;

    if (completionsError) {
      console.error("Completions fetch error:", completionsError);
      return c.json({ error: "Failed to fetch completions" }, 500);
    }

    return c.json({ completions });
  } catch (error) {
    console.error("Get completions error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Mark habit as complete
app.post("/make-server-ba03ada2/completions", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { habit_id, completion_date } = await c.req.json();

    if (!habit_id || !completion_date) {
      return c.json({ error: "Habit ID and completion date are required" }, 400);
    }

    // Check if already completed
    const { data: existing } = await supabase
      .from("habit_completions")
      .select("*")
      .eq("habit_id", habit_id)
      .eq("user_id", user.id)
      .eq("completion_date", completion_date)
      .single();

    if (existing) {
      return c.json({ message: "Habit already completed for this date", completion: existing });
    }

    const { data: completion, error: completionError } = await supabase
      .from("habit_completions")
      .insert({
        habit_id,
        user_id: user.id,
        completion_date
      })
      .select()
      .single();

    if (completionError) {
      console.error("Completion creation error:", completionError);
      return c.json({ error: "Failed to mark habit as complete" }, 500);
    }

    return c.json({ completion });
  } catch (error) {
    console.error("Complete habit error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Unmark habit completion
app.delete("/make-server-ba03ada2/completions/:habit_id/:date", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const habitId = c.req.param("habit_id");
    const date = c.req.param("date");

    const { error: deleteError } = await supabase
      .from("habit_completions")
      .delete()
      .eq("habit_id", habitId)
      .eq("user_id", user.id)
      .eq("completion_date", date);

    if (deleteError) {
      console.error("Completion deletion error:", deleteError);
      return c.json({ error: "Failed to unmark habit completion" }, 500);
    }

    return c.json({ message: "Habit completion removed successfully" });
  } catch (error) {
    console.error("Uncomplete habit error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ==================== FRIENDS ROUTES ====================

// Get user's friends
app.get("/make-server-ba03ada2/friends", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get friendships and join with user data
    const { data: friendships, error: friendshipsError } = await supabase
      .from("friendships")
      .select(`
        friend_id,
        users!friendships_friend_id_fkey (
          id,
          username,
          email,
          avatar,
          created_at
        )
      `)
      .eq("user_id", user.id);

    if (friendshipsError) {
      console.error("Friendships fetch error:", friendshipsError);
      return c.json({ error: "Failed to fetch friends" }, 500);
    }

    const friends = friendships?.map(f => f.users) || [];

    return c.json({ friends });
  } catch (error) {
    console.error("Get friends error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Send friend request
app.post("/make-server-ba03ada2/friends/request", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { to_user_id } = await c.req.json();

    if (!to_user_id) {
      return c.json({ error: "Recipient user ID is required" }, 400);
    }

    if (to_user_id === user.id) {
      return c.json({ error: "Cannot send friend request to yourself" }, 400);
    }

    // Check if request already exists
    const { data: existing } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("from_user_id", user.id)
      .eq("to_user_id", to_user_id)
      .eq("status", "pending")
      .single();

    if (existing) {
      return c.json({ error: "Friend request already sent" }, 400);
    }

    const { data: request, error: requestError } = await supabase
      .from("friend_requests")
      .insert({
        from_user_id: user.id,
        to_user_id
      })
      .select()
      .single();

    if (requestError) {
      console.error("Friend request creation error:", requestError);
      return c.json({ error: "Failed to send friend request" }, 500);
    }

    return c.json({ request });
  } catch (error) {
    console.error("Send friend request error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get pending friend requests
app.get("/make-server-ba03ada2/friends/requests", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data: requests, error: requestsError } = await supabase
      .from("friend_requests")
      .select(`
        *,
        from_user:users!friend_requests_from_user_id_fkey (
          id,
          username,
          email,
          avatar
        )
      `)
      .eq("to_user_id", user.id)
      .eq("status", "pending");

    if (requestsError) {
      console.error("Friend requests fetch error:", requestsError);
      return c.json({ error: "Failed to fetch friend requests" }, 500);
    }

    return c.json({ requests });
  } catch (error) {
    console.error("Get friend requests error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Accept friend request
app.post("/make-server-ba03ada2/friends/accept/:request_id", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const requestId = c.req.param("request_id");

    // Get the request
    const { data: request, error: requestError } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("id", requestId)
      .eq("to_user_id", user.id)
      .eq("status", "pending")
      .single();

    if (requestError || !request) {
      return c.json({ error: "Friend request not found" }, 404);
    }

    // Update request status
    await supabase
      .from("friend_requests")
      .update({ status: "accepted" })
      .eq("id", requestId);

    // Create bidirectional friendship
    const { error: friendship1Error } = await supabase
      .from("friendships")
      .insert({
        user_id: request.from_user_id,
        friend_id: user.id
      });

    const { error: friendship2Error } = await supabase
      .from("friendships")
      .insert({
        user_id: user.id,
        friend_id: request.from_user_id
      });

    if (friendship1Error || friendship2Error) {
      console.error("Friendship creation error:", friendship1Error || friendship2Error);
      return c.json({ error: "Failed to create friendship" }, 500);
    }

    return c.json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("Accept friend request error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ==================== COMMUNITY ROUTES ====================

// Get community posts
app.get("/make-server-ba03ada2/community/posts", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data: posts, error: postsError } = await supabase
      .from("community_posts")
      .select(`
        *,
        user:users!community_posts_user_id_fkey (
          id,
          username,
          avatar
        ),
        habit:habits!community_posts_habit_id_fkey (
          id,
          title,
          description,
          category
        ),
        likes:post_likes (
          user_id
        ),
        comments:post_comments (
          id,
          content,
          created_at,
          user:users!post_comments_user_id_fkey (
            id,
            username,
            avatar
          )
        )
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (postsError) {
      console.error("Community posts fetch error:", postsError);
      return c.json({ error: "Failed to fetch community posts" }, 500);
    }

    return c.json({ posts });
  } catch (error) {
    console.error("Get community posts error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Create community post
app.post("/make-server-ba03ada2/community/posts", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { habit_id, streak } = await c.req.json();

    if (!habit_id) {
      return c.json({ error: "Habit ID is required" }, 400);
    }

    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .insert({
        user_id: user.id,
        habit_id,
        streak: streak || 0
      })
      .select()
      .single();

    if (postError) {
      console.error("Community post creation error:", postError);
      return c.json({ error: "Failed to create post" }, 500);
    }

    return c.json({ post });
  } catch (error) {
    console.error("Create community post error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Like/unlike a post
app.post("/make-server-ba03ada2/community/posts/:post_id/like", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const postId = c.req.param("post_id");

    // Check if already liked
    const { data: existingLike } = await supabase
      .from("post_likes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single();

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("Unlike error:", deleteError);
        return c.json({ error: "Failed to unlike post" }, 500);
      }

      return c.json({ message: "Post unliked", liked: false });
    } else {
      // Like
      const { error: likeError } = await supabase
        .from("post_likes")
        .insert({
          post_id: postId,
          user_id: user.id
        });

      if (likeError) {
        console.error("Like error:", likeError);
        return c.json({ error: "Failed to like post" }, 500);
      }

      return c.json({ message: "Post liked", liked: true });
    }
  } catch (error) {
    console.error("Like/unlike post error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Add comment to post
app.post("/make-server-ba03ada2/community/posts/:post_id/comment", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const postId = c.req.param("post_id");
    const { content } = await c.req.json();

    if (!content) {
      return c.json({ error: "Comment content is required" }, 400);
    }

    const { data: comment, error: commentError } = await supabase
      .from("post_comments")
      .insert({
        post_id: postId,
        user_id: user.id,
        content
      })
      .select(`
        *,
        user:users!post_comments_user_id_fkey (
          id,
          username,
          avatar
        )
      `)
      .single();

    if (commentError) {
      console.error("Comment creation error:", commentError);
      return c.json({ error: "Failed to add comment" }, 500);
    }

    return c.json({ comment });
  } catch (error) {
    console.error("Add comment error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ==================== STATS ROUTES ====================

// Get user statistics
app.get("/make-server-ba03ada2/stats", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get completions for the last 90 days
    const today = new Date();
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);

    const { data: completions, error: completionsError } = await supabase
      .from("habit_completions")
      .select("*")
      .eq("user_id", user.id)
      .gte("completion_date", ninetyDaysAgo.toISOString().split('T')[0]);

    if (completionsError) {
      console.error("Stats completions fetch error:", completionsError);
      return c.json({ error: "Failed to fetch statistics" }, 500);
    }

    // Calculate stats
    const completionsByDate = completions?.reduce((acc: any, comp: any) => {
      const date = comp.completion_date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(comp.habit_id);
      return acc;
    }, {}) || {};

    // Calculate current streak
    let currentStreak = 0;
    let checkDate = new Date(today);
    
    while (true) {
      const dateString = checkDate.toISOString().split('T')[0];
      if (completionsByDate[dateString] && completionsByDate[dateString].length > 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate best streak
    let bestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    const sortedDates = Object.keys(completionsByDate).sort();
    
    for (const dateString of sortedDates) {
      if (completionsByDate[dateString].length > 0) {
        const currentDate = new Date(dateString);
        
        if (lastDate === null) {
          tempStreak = 1;
        } else {
          const expectedNextDay = new Date(lastDate);
          expectedNextDay.setDate(expectedNextDay.getDate() + 1);
          
          if (currentDate.toDateString() === expectedNextDay.toDateString()) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }
        
        bestStreak = Math.max(bestStreak, tempStreak);
        lastDate = currentDate;
      }
    }

    return c.json({
      stats: {
        currentStreak,
        bestStreak,
        totalCompletions: completions?.length || 0,
        completionsByDate
      }
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

Deno.serve(app.fetch);