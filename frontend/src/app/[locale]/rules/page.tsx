import LocaleLink from "@/components/LocaleLink"
import Header from "@/components/Header"
import EmailIcon from "@/components/icons/EmailIcon"
import TelegramIcon from "@/components/icons/TelegramIcon"

export default function RulesPage() {
  return (
    <>
      <Header isAuthenticated={false} />

      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Правила та умови роботи</h1>
            <p className="text-gray-light">Ознайомтесь з умовами використання платформи</p>
          </div>

          <div className="bg-blur-dark border border-gray-medium rounded-lg p-6 sm:p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">1. Загальні положення</h2>
              <div className="space-y-3 text-gray-light leading-relaxed">
                <p>
                  Платформа — це закрита інвестиційна онлайн-платформа для роботи з криптовалютними активами.
                </p>
                <p>Використовуючи платформу, користувач підтверджує, що він:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Досяг повноліття згідно законодавства своєї країни</li>
                  <li>Діє добровільно та усвідомлено</li>
                  <li>Розуміє ризики інвестування в криптовалюту</li>
                  <li>Погоджується з усіма умовами цієї угоди</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">2. Реєстрація та верифікація</h2>
              <div className="space-y-3 text-gray-light leading-relaxed">
                <p>Для використання платформи необхідно пройти реєстрацію:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Реєстрація здійснюється за email та номером телефону</li>
                  <li>Обов'язкова верифікація через підтвердження email та SMS-код</li>
                  <li>Один користувач може мати лише один обліковий запис</li>
                  <li>Заборонено створення мультиакаунтів</li>
                  <li>Без верифікації доступ до інвестицій обмежений</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">3. Обмеження відповідальності</h2>
              <div className="space-y-3 text-gray-light leading-relaxed">
                <p className="font-medium text-foreground">
                  Користувач несе повну відповідальність за свої інвестиційні рішення.
                </p>
                <p>Платформа не несе відповідальності за:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Фінансові втрати, пов'язані з ринковими коливаннями</li>
                  <li>Затримки, викликані роботою блокчейн-мереж</li>
                  <li>Технічні збої третіх сторін (біржі, гаманці)</li>
                  <li>Дії або бездіяльність інших користувачів</li>
                </ul>
                <p className="font-medium text-foreground">Платформа не гарантує фіксований прибуток.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">4. Депозити та інвестування</h2>
              <div className="space-y-3 text-gray-light leading-relaxed">
                <p>Умови здійснення депозитів:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Усі депозити здійснюються виключно через криптовалюту</li>
                  <li>
                    Мінімальна сума депозиту: <span className="font-sans">$100</span>
                  </li>
                  <li>Кошти зараховуються на внутрішній баланс після підтвердження транзакції</li>
                  <li>Прибуток нараховується автоматично згідно обраного плану</li>
                  <li>Термін інвестування залежить від обраного плану</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">5. Виводи та депозити</h2>
              <div className="space-y-3 text-gray-light leading-relaxed">
                <p>Правила виводу коштів:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Вивід здійснюється через криптовалюту</li>
                  <li>
                    Мінімальна сума виводу залежить від обраного методу (<span className="font-sans">$50-$100</span>)
                  </li>
                  <li>
                    Комісія платформи: <span className="font-sans">1-2%</span> залежно від методу
                  </li>
                  <li>
                    Час обробки заявки: <span className="font-sans">24-48</span> годин
                  </li>
                  <li>Платформа має право запросити додаткову верифікацію</li>
                  <li>Мінімальні та максимальні суми можуть бути змінені адміністрацією</li>
                </ul>
                <p className="font-medium text-foreground">
                  Платформа має право призупинити вивід у разі підозри на порушення правил або шахрайство.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">6. Реферальна програма</h2>
              <div className="space-y-3 text-gray-light leading-relaxed">
                <p>Умови реферальної програми:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Кожен користувач отримує унікальне реферальне посилання</li>
                  <li>
                    Винагорода: <span className="font-sans">5%</span> від депозитів залучених користувачів
                  </li>
                  <li>Реферальний дохід доступний для виводу на загальних умовах</li>
                  <li>Заборонено використання самореферальних схем</li>
                  <li>Порушення правил реферальної програми призводить до блокування</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">7. Обліковий запис</h2>
              <div className="space-y-3 text-gray-light leading-relaxed">
                <p>Правила користування обліковим записом:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Один користувач може мати лише один обліковий запис</li>
                  <li>Категорично заборонено створення мультиакаунтів</li>
                  <li>Користувач несе відповідальність за конфіденційність свого пароля</li>
                  <li>Передача облікового запису іншим особам заборонена</li>
                  <li>При підозрі на несанкціонований доступ — негайно повідомте підтримку</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">8. Заборонені дії</h2>
              <div className="space-y-3 text-gray-light leading-relaxed">
                <p>Категорично заборонено:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Використання ботів, скриптів, автоматизованих систем</li>
                  <li>Спроби зламу або обходу систем безпеки</li>
                  <li>Створення мультиакаунтів та використання самореферальних схем</li>
                  <li>Відмивання коштів та інші незаконні операції</li>
                  <li>Поширення неправдивої інформації про платформу</li>
                </ul>
                <p className="font-medium text-accent">
                  Порушення цих правил призводить до негайного блокування облікового запису без можливості відновлення.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">9. Політика ризиків</h2>
              <div className="space-y-3 text-gray-light leading-relaxed">
                <p className="font-medium text-foreground">
                  Інвестування в криптовалюту пов'язане з високими ризиками.
                </p>
                <p>Користувач підтверджує, що розуміє:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Вартість криптовалют може різко змінюватись</li>
                  <li>Існує ризик повної втрати інвестованих коштів</li>
                  <li>Прибуток не гарантований і може відрізнятись від прогнозів</li>
                  <li>Регуляторні зміни можуть вплинути на роботу платформи</li>
                </ul>
                <p className="font-medium text-accent">
                  Інвестуйте лише ті кошти, втрату яких ви можете собі дозволити.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">10. Зміна умов</h2>
              <div className="space-y-3 text-gray-light leading-relaxed">
                <p>Платформа залишає за собою право змінювати ці правила в будь-який час.</p>
                <p>Користувачі будуть повідомлені про значні зміни через:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Email повідомлення</li>
                  <li>Сповіщення в особистому кабінеті</li>
                  <li>Оголошення на головній сторінці</li>
                </ul>
                <p>Продовження використання платформи після змін означає згоду з новими умовами.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">11. Контакти та підтримка</h2>
              <div className="space-y-3 text-gray-light leading-relaxed">
                <p>Якщо у вас виникли питання або проблеми, зв'яжіться з нашою службою підтримки:</p>
                <div className="bg-blur border border-gray-medium rounded-lg p-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <EmailIcon className="w-5 h-5 text-accent" />
                      <span>Email: support@conglomerate.com</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TelegramIcon className="w-5 h-5 text-accent" />
                      <span>Telegram: @conglomerate_support</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="pt-8 border-t border-gray-medium">
              <p className="text-sm text-gray-light text-center">
                Останнє оновлення: <span className="font-sans">5</span> січня <span className="font-sans">2026</span>{" "}
                року
              </p>
              <p className="text-sm text-gray-light text-center mt-2">
                © <span className="font-sans">2026</span>. Всі права захищені.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
