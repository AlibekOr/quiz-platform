import { ParamSelect } from "@/components/common/param-select";
import { Input } from "@/components/ui/input";
import { DIFFICULTY_LABEL, type Difficulty } from "@/lib/bank";
import {
  getTopics,
  listBankQuestions,
  type BankFilters,
} from "@/lib/bank-data";
import { db } from "@/lib/db";
import { BankQuestionList } from "./bank-question-list";
import { TopicTree } from "./topic-tree";

type Params = Record<string, string | string[] | undefined>;

function param(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

/**
 * Savollar banki: mavzular daraxti, qidiruv va filtrlar, savollar ro'yxati.
 * readOnly — admin ko'rinishi (faqat ko'radi)
 */
export async function BankView({
  ownerId,
  params,
  action,
  readOnly,
  testHref,
  hidden = {},
}: {
  ownerId: string;
  params: Params;
  /** Qidiruv formasi yuboriladigan sahifa */
  action: string;
  readOnly: boolean;
  testHref: string | null;
  /** Qidiruvda saqlanadigan qo'shimcha parametrlar (masalan, admin uchun teacher) */
  hidden?: Record<string, string>;
}) {
  const topics = await getTopics(ownerId);
  const difficulty = param(params.difficulty);
  const type = param(params.type);
  const topic = param(params.topic);
  const filters: BankFilters = {
    q: param(params.q).slice(0, 200),
    topicId: topics.some((t) => t.id === topic) ? topic : null,
    difficulty: DIFFICULTIES.includes(difficulty as Difficulty)
      ? (difficulty as Difficulty)
      : null,
    type: type === "SINGLE" || type === "MULTIPLE" ? type : null,
    tag: param(params.tag).slice(0, 30),
    archived: param(params.archived) === "1",
  };
  const [{ items, total }, tagRows] = await Promise.all([
    listBankQuestions(ownerId, filters, topics),
    db.bankQuestion.findMany({
      where: { ownerId, archivedAt: null },
      select: { tags: true },
    }),
  ]);
  const tags = [...new Set(tagRows.flatMap((r) => r.tags))].sort((a, b) =>
    a.localeCompare(b, "uz"),
  );
  const keep = {
    ...hidden,
    ...Object.fromEntries(
      ["topic", "difficulty", "type", "tag", "archived"]
        .map((k) => [k, param(params[k])] as const)
        .filter(([, v]) => v !== ""),
    ),
  };

  return (
    <div className="grid gap-6 md:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="md:border-r md:pr-4">
        <details className="md:hidden" open={topics.length === 0}>
          <summary className="cursor-pointer text-sm font-medium">
            Mavzular ({topics.length})
          </summary>
          <div className="pt-2">
            <TopicTree topics={topics} readOnly={readOnly} />
          </div>
        </details>
        <div className="hidden md:block">
          <TopicTree topics={topics} readOnly={readOnly} />
        </div>
      </aside>
      <div className="flex min-w-0 flex-col gap-4">
        <form className="flex flex-wrap gap-2" action={action}>
          <Input
            name="q"
            defaultValue={filters.q}
            placeholder="Savol matni bo'yicha qidiruv"
            className="w-full sm:w-64"
            aria-label="Qidiruv"
          />
          {Object.entries(keep).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
        </form>
        <div className="flex flex-wrap gap-2">
          <ParamSelect
            name="difficulty"
            value={filters.difficulty ?? ""}
            label="Qiyinlik"
            options={[
              { value: "", label: "Barcha qiyinliklar" },
              ...DIFFICULTIES.map((d) => ({
                value: d,
                label: DIFFICULTY_LABEL[d],
              })),
            ]}
          />
          <ParamSelect
            name="type"
            value={filters.type ?? ""}
            label="Turi"
            options={[
              { value: "", label: "Barcha turlar" },
              { value: "SINGLE", label: "Bitta javob" },
              { value: "MULTIPLE", label: "Bir nechta javob" },
            ]}
          />
          {tags.length > 0 && (
            <ParamSelect
              name="tag"
              value={filters.tag}
              label="Teg"
              options={[
                { value: "", label: "Barcha teglar" },
                ...tags.map((t) => ({ value: t, label: `#${t}` })),
              ]}
            />
          )}
          <ParamSelect
            name="archived"
            value={filters.archived ? "1" : ""}
            label="Holati"
            options={[
              { value: "", label: "Faol savollar" },
              { value: "1", label: "Arxiv" },
            ]}
          />
        </div>
        <BankQuestionList
          items={items}
          total={total}
          topics={topics}
          activeTopicId={filters.topicId}
          readOnly={readOnly}
          testHref={testHref}
        />
      </div>
    </div>
  );
}
