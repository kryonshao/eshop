import { supabase } from "@/integrations/supabase/client";

interface GuestReviewData {
  product_id: string;
  rating: number;
  title?: string;
  content?: string;
  images?: string[];
  guest_name: string;
  guest_email: string;
}

export class ReviewService {
  // 检查IP频率限制
  async checkIPRateLimit(ip: string, limit: number = 3, window: 'hour' | 'day' = 'hour'): Promise<boolean> {
    const now = new Date();
    let timeWindow = new Date();
    
    if (window === 'hour') {
      timeWindow.setHours(now.getHours() - 1);
    } else {
      timeWindow.setDate(now.getDate() - 1);
    }

    const { data, error } = await supabase
      .from("reviews")
      .select("id")
      .eq("reviewer_type", "guest")
      .gte("created_at", timeWindow.toISOString())
      .lte("created_at", now.toISOString());

    if (error) {
      console.error("Error checking IP rate limit:", error);
      return false;
    }

    return (data || []).length < limit;
  }

  // 检查邮箱频率限制
  async checkEmailRateLimit(email: string, limit: number = 5, window: 'hour' | 'day' = 'day'): Promise<boolean> {
    const now = new Date();
    let timeWindow = new Date();
    
    if (window === 'hour') {
      timeWindow.setHours(now.getHours() - 1);
    } else {
      timeWindow.setDate(now.getDate() - 1);
    }

    try {
      const query = supabase
        .from("reviews")
        .select("id")
        .eq("reviewer_type", "guest")
        .eq("guest_email", email)
        .gte("created_at", timeWindow.toISOString())
        .lte("created_at", now.toISOString());

      const { data, error } = await query;

      if (error) {
        console.error("Error checking email rate limit:", error);
        return false;
      }

      return (data || []).length < limit;
    } catch (error) {
      console.error("Error checking email rate limit:", error);
      return false;
    }
  }

  // 验证邮箱格式
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 提交访客评价
  async submitGuestReview(data: GuestReviewData): Promise<{ success: boolean; error?: string }> {
    // 邮箱格式验证
    if (!this.validateEmail(data.guest_email)) {
      return { success: false, error: "邮箱格式无效" };
    }

    // 频率限制
    // TODO: 获取用户IP地址
    // const ip = await this.getClientIP();
    // if (!await this.checkIPRateLimit(ip)) {
    //   return { success: false, error: "提交频率过高，请稍后再试" };
    // }

    if (!await this.checkEmailRateLimit(data.guest_email)) {
      return { success: false, error: "该邮箱提交评价过于频繁，请稍后再试" };
    }

    // 内容验证
    if (!data.rating || data.rating < 1 || data.rating > 5) {
      return { success: false, error: "请选择1-5星评分" };
    }

    if (!data.guest_name.trim()) {
      return { success: false, error: "请填写姓名" };
    }

    if (data.guest_name.length > 50) {
      return { success: false, error: "姓名长度不能超过50个字符" };
    }

    if (data.title && data.title.length > 100) {
      return { success: false, error: "标题长度不能超过100个字符" };
    }

    if (data.content && data.content.length > 500) {
      return { success: false, error: "内容长度不能超过500个字符" };
    }

    try {
      const { error } = await supabase.from("reviews").insert({
        product_id: data.product_id,
        rating: data.rating,
        title: data.title?.trim() || null,
        content: data.content?.trim() || null,
        images: data.images && data.images.length > 0 ? data.images : null,
        guest_name: data.guest_name.trim(),
        guest_email: data.guest_email.trim(),
        reviewer_type: 'guest',
        status: 'pending', // 访客评价默认待审核
      });

      if (error) {
        if (error.code === "23505") {
          return { success: false, error: "您已经评价过该商品" };
        }
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error submitting guest review:", error);
      return { success: false, error: "提交失败，请重试" };
    }
  }

  // 提交用户评价
  async submitUserReview(data: Omit<GuestReviewData, 'guest_name' | 'guest_email'> & { user_id: string; order_id?: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from("reviews").insert({
        product_id: data.product_id,
        rating: data.rating,
        title: data.title?.trim() || null,
        content: data.content?.trim() || null,
        images: data.images && data.images.length > 0 ? data.images : null,
        user_id: data.user_id,
        order_id: data.order_id,
        reviewer_type: 'user',
        status: 'approved', // 用户评价默认直接通过
      });

      if (error) {
        if (error.code === "23505") {
          return { success: false, error: "您已经评价过该商品" };
        }
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error submitting user review:", error);
      return { success: false, error: "提交失败，请重试" };
    }
  }

  // 获取评价列表
  async getReviews(productId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching reviews:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching reviews:", error);
      return [];
    }
  }

  // 获取待审核的评价
  async getPendingReviews(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching pending reviews:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching pending reviews:", error);
      return [];
    }
  }

  // 审核评价
  async approveReview(reviewId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ status: "approved" })
        .eq("id", reviewId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error approving review:", error);
      return { success: false, error: "操作失败" };
    }
  }

  // 拒绝评价
  async rejectReview(reviewId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ status: "rejected" })
        .eq("id", reviewId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error rejecting review:", error);
      return { success: false, error: "操作失败" };
    }
  }

  // 删除评价
  async deleteReview(reviewId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error deleting review:", error);
      return { success: false, error: "操作失败" };
    }
  }
}

// 单例实例
export const reviewService = new ReviewService();