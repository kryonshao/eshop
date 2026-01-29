import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Languages, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { i18nService, type ProductTranslation } from "@/services/i18n/I18nService";
import type { Locale, SupportedLocale } from "@/types/locale";

interface ProductTranslationManagerProps {
  productId: string;
  productName: string;
}

export default function ProductTranslationManager({
  productId,
  productName,
}: ProductTranslationManagerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [translations, setTranslations] = useState<Record<string, ProductTranslation>>({});
  const [activeLocale, setActiveLocale] = useState<string>("zh-CN");

  useEffect(() => {
    loadTranslations();
  }, [productId]);

  const loadTranslations = async () => {
    setLoading(true);
    try {
      const allTranslations = await i18nService.getProductTranslations(productId);
      
      // Initialize translations object with empty values for missing locales
      const translationsMap: Record<string, ProductTranslation> = {};
      
      allTranslations.forEach((translation) => {
        if (translation.locale) {
          translationsMap[translation.locale] = translation;
        }
      });
      
      setTranslations(translationsMap);
    } catch (error) {
      console.error("Error loading translations:", error);
      toast({
        title: "加载失败",
        description: "无法加载商品翻译，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (localeCode: string) => {
    setSaving(true);
    try {
      const translation = translations[localeCode];
      
      // Validate required fields
      if (!translation.title.trim()) {
        toast({
          title: "验证失败",
          description: "标题不能为空",
          variant: "destructive",
        });
        return;
      }
      
      await i18nService.saveProductTranslation(translation);
      
      toast({
        title: "保存成功",
        description: `已保存 ${localeCode} 翻译`,
      });
    } catch (error) {
      console.error("Error saving translation:", error);
      toast({
        title: "保存失败",
        description: "无法保存翻译，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const promises = Object.keys(translations).map((localeCode) => {
        const translation = translations[localeCode];
        if (translation.title.trim()) {
          return i18nService.saveProductTranslation(translation);
        }
        return Promise.resolve();
      });
      
      await Promise.all(promises);
      
      toast({
        title: "保存成功",
        description: "所有翻译已保存",
      });
    } catch (error) {
      console.error("Error saving all translations:", error);
      toast({
        title: "保存失败",
        description: "部分翻译保存失败，请检查后重试",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateTranslation = (locale: string, field: keyof ProductTranslation, value: string) => {
    setTranslations((prev) => ({
      ...prev,
      [locale]: {
        ...prev[locale],
        [field]: value,
      },
    }));
  };

  const getCompletionStatus = () => {
    const completed = Object.values(translations).filter(
      (translation) => translation.title?.trim() && translation.description?.trim()
    ).length;
    return `${completed}/${Object.keys(translations).length}`;
  };

  const isTranslationComplete = (locale: string) => {
    const translation = translations[locale];
    return translation?.title?.trim() && translation?.description?.trim();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              商品翻译管理
            </CardTitle>
            <CardDescription className="mt-1">
              为 "{productName}" 添加多语言翻译
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              完成度: <span className="font-semibold">{getCompletionStatus()}</span>
            </div>
            <Button onClick={handleSaveAll} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  保存所有
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeLocale} onValueChange={(value) => setActiveLocale(value)}>
          <TabsList className="grid w-full grid-cols-5">
            {[
              { code: "zh-CN", name: "中文", flag: "🇨🇳" },
              { code: "en-US", name: "English", flag: "🇺🇸" },
              { code: "es-ES", name: "Español", flag: "🇪🇸" },
              { code: "fr-FR", name: "Français", flag: "🇫🇷" },
              { code: "de-DE", name: "Deutsch", flag: "🇩🇪" },
            ].map((locale) => (
              <TabsTrigger
                key={locale.code}
                value={locale.code}
                className="flex items-center gap-2"
              >
                <span>{locale.flag}</span>
                <span className="hidden sm:inline">{locale.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {Object.entries(translations).map(([localeCode, translation]) => (
            <TabsContent key={localeCode} value={localeCode} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor={`title-${localeCode}`}>
                  标题 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`title-${localeCode}`}
                  value={translation.title || ""}
                  onChange={(e) => updateTranslation(localeCode, "title", e.target.value)}
                  placeholder={`输入${locale.name || localeCode}标题`}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`description-${localeCode}`}>
                  描述 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id={`description-${localeCode}`}
                  value={translation.description || ""}
                  onChange={(e) => updateTranslation(localeCode, "description", e.target.value)}
                  placeholder={`输入${locale.name || localeCode}描述`}
                  rows={6}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`specifications-${localeCode}`}>
                  规格说明（可选）
                </Label>
                <Textarea
                  id={`specifications-${localeCode}`}
                  value={translation.specifications ? JSON.stringify(translation.specifications, null, 2) : ""}
                  onChange={(e) => {
                    try {
                      const specs = e.target.value ? JSON.parse(e.target.value) : {};
                      updateTranslation(localeCode, "specifications", JSON.stringify(specs));
                    } catch (error) {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder='{"材质": "纯棉", "产地": "中国"}'
                  rows={4}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  请输入有效的 JSON 格式，例如: {`{"key": "value"}`}
                </p>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  onClick={() => handleSave(localeCode)}
                  disabled={saving || !translation.title?.trim()}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      保存 {localeCode}
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}