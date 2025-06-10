import { supabase } from "./supabase";

export const testSupabaseConnection = async () => {
  try {
    console.log("=== TESTING SUPABASE CONNECTION ===");

    // Test 1: Basic connection
    console.log("1. Testing basic connection...");
    console.log("Supabase URL:", process.env.EXPO_PUBLIC_SUPABASE_URL);
    console.log(
      "Supabase Key (first 20 chars):",
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + "..."
    );

    // Test 2: Auth status
    console.log("2. Testing auth status...");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) {
      console.error("Auth error:", authError);
      return false;
    }
    console.log("User authenticated:", user ? `Yes (${user.id})` : "No");

    // Test 3: Database connection
    console.log("3. Testing database connection...");
    const { data: dbData, error: dbError } = await supabase
      .from("generated_images")
      .select("count")
      .limit(1);

    if (dbError) {
      console.error("Database error:", dbError);
      return false;
    }
    console.log("✅ Database connection successful");

    // Test 4: Storage buckets
    console.log("4. Testing storage buckets...");
    const { data: buckets, error: storageError } =
      await supabase.storage.listBuckets();

    if (storageError) {
      console.error("Storage error:", storageError);
      return false;
    }

    console.log(
      "Available buckets:",
      buckets?.map((b) => b.name)
    );
    const hasGeneratedImagesBucket = buckets?.some(
      (b) => b.name === "generated-images"
    );
    console.log("Has generated-images bucket:", hasGeneratedImagesBucket);

    // Test 5: Storage policies
    if (hasGeneratedImagesBucket) {
      console.log("5. Testing storage upload...");
      try {
        // Create a small test blob
        const testBlob = new Blob(["test"], { type: "text/plain" });
        const testFileName = `test-${Date.now()}.txt`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("generated-images")
          .upload(`test/${testFileName}`, testBlob);

        if (uploadError) {
          console.error("Upload test failed:", uploadError);
          return false;
        }

        console.log("✅ Upload test successful");

        // Clean up test file
        await supabase.storage
          .from("generated-images")
          .remove([`test/${testFileName}`]);

        console.log("✅ Cleanup successful");
      } catch (uploadTestError) {
        console.error("Upload test failed:", uploadTestError);
        return false;
      }
    }

    console.log("=== ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("Connection test failed:", error);
    return false;
  }
};

export const testImageUpload = async (base64Data: string) => {
  try {
    console.log("=== TESTING IMAGE UPLOAD ===");

    // Test convert base64 to blob
    console.log("1. Converting base64 to blob...");
    const response = await fetch(base64Data);
    const blob = await response.blob();
    console.log("Blob size:", blob.size, "bytes");
    console.log("Blob type:", blob.type);

    if (blob.size === 0) {
      throw new Error("Blob is empty");
    }

    // Test auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    // Test upload
    const testFileName = `test-image-${Date.now()}.png`;
    const filePath = `${user.id}/${testFileName}`;

    console.log("2. Uploading to path:", filePath);

    const { data, error } = await supabase.storage
      .from("generated-images")
      .upload(filePath, blob, {
        contentType: "image/png",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      throw error;
    }

    console.log("✅ Upload successful:", data);

    // Test get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("generated-images").getPublicUrl(data.path);

    console.log("✅ Public URL:", publicUrl);

    // Clean up
    await supabase.storage.from("generated-images").remove([filePath]);

    console.log("✅ Test cleanup successful");
    return true;
  } catch (error) {
    console.error("Image upload test failed:", error);
    return false;
  }
};
