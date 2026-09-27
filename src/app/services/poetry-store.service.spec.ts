import { TestBed } from '@angular/core/testing';
import { PoetryStoreService } from './poetry-store.service';

type AnyTone = '平' | '仄' | '中' | '?';

describe('PoetryStoreService 对仗逐字核对', () => {
  let store: PoetryStoreService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(PoetryStoreService);
  });

  function setTone(line: number, position: number, tone: AnyTone): void {
    store.selectCell(line, position);
    store.setMark({ tone });
  }

  function setLineTones(line: number, tones: AnyTone[]): void {
    tones.forEach((tone, position) => setTone(line, position, tone));
  }

  function addPairOnLineZero(): void {
    store.selectCell(0, 0);
    store.addAntithesis();
  }

  it('两句字数不一致判为失对，并指出缺位字位', () => {
    store.updateText('仄仄平平仄\n平平仄仄\n平平平仄仄\n仄仄仄平平');
    setLineTones(0, ['仄', '仄', '平', '平', '仄']);
    setLineTones(1, ['平', '平', '仄', '仄']);
    addPairOnLineZero();

    const check = store.antithesisChecks()[0];
    expect(check.status).toBe('length-mismatch');
    expect(check.leftLength).toBe(5);
    expect(check.rightLength).toBe(4);
    expect(check.firstMismatch?.kind).toBe('missing');
    expect(check.firstMismatch?.position).toBe(4);
  });

  it('已定平仄处同声算一处失对，并标出第一处', () => {
    store.updateText('仄仄平平仄\n平平仄仄平\n平平平仄仄\n仄仄仄平平');
    setLineTones(0, ['平', '仄', '平', '仄', '仄']);
    setLineTones(1, ['平', '平', '仄', '仄', '仄']);
    addPairOnLineZero();

    const check = store.antithesisChecks()[0];
    expect(check.status).toBe('mismatch');
    expect(check.firstMismatch?.position).toBe(0);
    expect(check.firstMismatch?.kind).toBe('same-tone');
    expect(check.firstMismatch?.tone).toBe('平');
    expect(check.mismatchCount).toBe(2);
    expect(check.positions[0].status).toBe('mismatch');
  });

  it('一平一仄逐字相对判为合格，押韵句末字不参与对照', () => {
    store.updateText('平仄平仄平\n仄平仄平平\n平平平仄仄\n仄仄仄平平');
    // 第二句是押韵句，末字（位置 4）与上句同为平声也不对照
    setLineTones(0, ['平', '仄', '平', '仄', '平']);
    setLineTones(1, ['仄', '平', '仄', '平', '平']);
    addPairOnLineZero();

    const check = store.antithesisChecks()[0];
    expect(check.status).toBe('match');
    expect(check.comparedCount).toBe(4);
    expect(check.positions[4].status).toBe('skipped-rhyme');
    expect(check.mismatchCount).toBe(0);
  });

  it('可平可仄（中）的字不参与对照', () => {
    store.updateText('平仄平仄平\n仄平仄仄平\n平平平仄仄\n仄仄仄平平');
    setLineTones(0, ['中', '仄', '平', '仄', '平']);
    setLineTones(1, ['平', '平', '仄', '平', '仄']);
    addPairOnLineZero();

    const check = store.antithesisChecks()[0];
    expect(check.status).toBe('match');
    expect(check.comparedCount).toBe(3);
    expect(check.positions[0].status).toBe('skipped-neutral');
  });

  it('平仄还没定的位置先不出结论', () => {
    store.updateText('仄仄平平仄\n平仄仄仄平\n平平平仄仄\n仄仄仄平平');
    setLineTones(0, ['?', '仄', '平', '仄', '平']);
    setLineTones(1, ['平', '平', '仄', '平', '仄']);
    addPairOnLineZero();

    const check = store.antithesisChecks()[0];
    expect(check.status).toBe('indeterminate');
    expect(check.unknownCount).toBe(1);
    expect(check.mismatchCount).toBe(0);
    expect(check.positions[0].status).toBe('unknown');
  });

  it('失对计入检查记录，合格对联不产生错误', () => {
    store.updateText('仄仄平平仄\n平平仄仄平\n平平平仄仄\n仄仄仄平平');
    setLineTones(0, ['平', '仄', '平', '仄', '平']);
    setLineTones(1, ['平', '平', '仄', '平', '仄']);
    addPairOnLineZero();

    const titles = store.issues().map((issue) => issue.title);
    expect(titles).toContain('对仗失对');
  });

  it('改正平仄后关系重算为合格', () => {
    store.updateText('仄仄平平仄\n平平仄仄平\n平平平仄仄\n仄仄仄平平');
    setLineTones(0, ['平', '仄', '平', '仄', '平']);
    setLineTones(1, ['平', '平', '仄', '平', '仄']);
    addPairOnLineZero();
    expect(store.antithesisChecks()[0].status).toBe('mismatch');

    setTone(1, 0, '仄');
    expect(store.antithesisChecks()[0].status).toBe('match');
  });

  it('改正文使两句字数变化后重算为字数失对', () => {
    store.updateText('平仄平仄平\n仄平仄仄平\n平平平仄仄\n仄仄仄平平');
    setLineTones(0, ['平', '仄', '平', '仄', '平']);
    setLineTones(1, ['仄', '平', '仄', '平', '仄']);
    addPairOnLineZero();
    expect(store.antithesisChecks()[0].status).toBe('match');

    store.updateText('平仄平仄平\n仄平仄仄\n平平平仄仄\n仄仄仄平平');
    expect(store.antithesisChecks()[0].status).toBe('length-mismatch');
  });

  it('导出校对稿写明失对与字位', () => {
    store.updateText('仄仄平平仄\n平平仄仄平\n平平平仄仄\n仄仄仄平平');
    setLineTones(0, ['平', '仄', '平', '仄', '平']);
    setLineTones(1, ['平', '平', '仄', '平', '仄']);
    addPairOnLineZero();

    const text = store.exportProofreadCopy();
    expect(text).toContain('对仗核对');
    expect(text).toContain('失对');
    expect(text).toContain('第 1 字');
  });
});
